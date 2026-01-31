import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { RESET_EXP_MIN } from 'constants/authConsts.js';
import { UserModel, type User } from '@models/User.js';
import { SessionModel, type Session } from '@models/Session.js';
import {
  generateAccessToken,
  generateCsrfToken,
  generateRefreshToken,
  generateVerificationToken,
  hashToken,
  verifyToken,
} from '@utils/tokens.js';
import type { LoginInput, RegisterInput } from '@validation/auth.schema.js';
import { createUsername } from '@modules/auth/utils/createUsername.js';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
} from '@middleware/error/index.js';
import sendWelcomeEmail from '@utils/emails/sender/sendWelcomeEmail.js';
import sendResetLink from '@utils/emails/sender/sendResetLink.js';
import sendPasswordUpdatedEmail from '@utils/emails/sender/sendPasswordUpdatedEmail.js';
import sendVerificationEmail from '@utils/emails/sender/sendEmailVerificationLink.js';
import ensureActiveAccount from 'security/guards/ensureActiveAccount.js';
import { getAccountBlockResponse } from 'security/guards/getAccountBlockResponse.js';
import { createSessionPayload } from './utils/createSessionPayload.js';
import { assignFreePlan } from '@modules/subscription/subscription.service.js';
import { withTransaction } from '@db/withTransaction.js';

type LoginInputWithMeta = LoginInput & {
  userAgent: string;
  ip: string | string[] | undefined;
};
type SignOutput = {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    csrfToken: string;
  };
};
type RegisterInputWithMeta = RegisterInput & {
  userAgent: string;
  ip: string | string[] | undefined;
};
interface RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
}

export async function registerUser(input: RegisterInputWithMeta): Promise<SignOutput> {
  const { email, password, displayName, username, userAgent, ip } = input;
  const existing = await UserModel.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    if (existing.username === username) {
      throw new ConflictError('Username already taken');
    } else {
      throw new ConflictError('Email already registered');
    }
  }
  // Metadata

  const passwordHash = await bcrypt.hash(password, 10);

  return withTransaction(async (session) => {
    const userName = username ? username : await createUsername(email, session);
    const result: User[] = await UserModel.create(
      [
        {
          email,
          passwordHash,
          username: userName.toLowerCase(),
          displayName: displayName ?? email.split('@')[0],
        },
      ],
      { session }
    );
    const user: User = result[0];

    await assignFreePlan(user._id, session);

    const { sessionPayload, tokens } = await createSessionPayload({
      user,
      userAgent,
      ip: (Array.isArray(ip) ? ip[0] : ip) || '',
    });
    await SessionModel.create(
      [
        {
          ...sessionPayload,
        },
      ],
      { session }
    );
    // enqueue welcome email
    sendWelcomeEmail(user.email, user.displayName, user.username);
    return { user, tokens };
  });
}

export async function loginUser(input: LoginInputWithMeta): Promise<SignOutput> {
  return withTransaction(async (session) => {
    const { email, password, userAgent, ip } = input;

    const user: User | null = await UserModel.findOne({ email }).select('+passwordHash +changeHistory');
    if (!user) {
      throw new UnauthenticatedError('Email or Password does not match!');
    }
    const active = ensureActiveAccount(user);
    if (!active) {
      const status = user.accountStatus;
      const errorResponse = getAccountBlockResponse(status);
      if (errorResponse) {
        throw new ForbiddenError(errorResponse.message, {
          reason: errorResponse.reason,
          nextStep: errorResponse.nextStep,
        });
      }
      throw new UnauthenticatedError('Not allowed to login.');
    }

    const passedTest = await bcrypt.compare(password, user.passwordHash);
    if (!passedTest) {
      throw new UnauthenticatedError('Email or Password does not match!');
    }

    const { sessionPayload, tokens } = await createSessionPayload({
      user,
      userAgent,
      ip: (Array.isArray(ip) ? ip[0] : ip) || '',
    });
    await SessionModel.create(
      [
        {
          ...sessionPayload,
        },
      ],
      { session }
    );
    return { user, tokens };
  });
}

export async function refreshTokens(
  refreshToken: string,
  userAgent: string,
  ip: string | string[] | undefined
): Promise<RefreshTokenOutput> {
  let decoded: {
    userId: string;
    sessionId: string;
    role: 'user' | 'admin';
  };

  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as typeof decoded;
  } catch {
    throw new UnauthenticatedError('Authentication failed');
  }

  const session = await SessionModel.findOne({
    sessionId: decoded.sessionId,
    userId: decoded.userId,
    valid: true,
    revokedAt: null,
  }).select('+refreshTokenHash +csrfTokenHash +expiresIn');

  if (!session || !session.refreshTokenHash || !session.expiresIn) {
    throw new UnauthenticatedError('Authentication failed');
  }

  if (session.expiresIn.getTime() <= Date.now()) {
    await SessionModel.updateOne({ _id: session._id }, { valid: false, revokedAt: new Date() }).exec();

    throw new UnauthenticatedError('Authentication failed: Session expired');
  }

  const isValidToken = verifyToken(refreshToken, session.refreshTokenHash);

  if (!isValidToken) {
    await SessionModel.updateOne({ _id: session._id }, { valid: false, revokedAt: new Date() }).exec();

    throw new UnauthenticatedError('Authentication failed: Session revoked');
  }

  const user = await UserModel.findOne({
    _id: decoded.userId,
    accountStatus: { $ne: 'banned' },
  });

  if (!user) {
    throw new UnauthenticatedError('Authentication failed');
  }

  // rotate tokens
  const newAccessToken = generateAccessToken(user._id, session.sessionId, user.role, user.accountStatus);

  const newRefreshToken = generateRefreshToken(user._id, session.sessionId);

  const newCsrfToken = generateCsrfToken();

  await SessionModel.updateOne(
    {
      _id: session._id,
      refreshTokenHash: session.refreshTokenHash,
    },
    {
      refreshTokenHash: hashToken(newRefreshToken),
      csrfTokenHash: hashToken(newCsrfToken),
      lastUsedAt: new Date(),
      userAgent,
      ip: Array.isArray(ip) ? ip[0] : ip,
    }
  ).exec();

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    csrfToken: newCsrfToken,
  };
}

export async function createPasswordResetRequest(email: string) {
  const normalized = email.trim().toLowerCase();
  const user: User | null = await UserModel.findOne({
    email: normalized,
  }).select('+passwordReset +changeHistory +accountStatus');
  if (!user || user.accountStatus !== 'active') {
    generateVerificationToken();
    setTimeout(() => {}, 500);
    return;
  }
  const { raw, hash } = generateVerificationToken();
  const expiresAt = new Date(Date.now() + RESET_EXP_MIN * 60 * 1000);

  await UserModel.updateOne(
    { _id: user._id },
    {
      passwordReset: { tokenHash: hash, expiresAt, requestedAt: new Date() },
      $push: {
        changeHistory: {
          $each: [
            {
              field: 'password',
              from: null,
              to: null,
              by: user._id,
              reason: 'User requested password reset',
              at: new Date(),
              via: 'user',
            },
          ],
          $slice: -100,
        },
      },
    }
  );

  const resetUrl = `${process.env.APP_URL}/auth/reset-password?token=${encodeURIComponent(
    raw
  )}&email=${encodeURIComponent(user.email)}`;

  sendResetLink(user, resetUrl);
  return;
}

export async function resetPassword(rawToken: string, newPassword: string) {
  const hash = hashToken(rawToken);
  let emailPayload: User | null = null;

  await withTransaction(async (session) => {
    const user: User | null = await UserModel.findOne({
      'passwordReset.tokenHash': hash,
    })
      .select('+passwordReset +passwordHash +changeHistory +accountStatus')
      .session(session);
    if (
      !user ||
      !user.passwordReset?.tokenHash ||
      !user.passwordReset.expiresAt ||
      user.accountStatus !== 'active'
    ) {
      throw new BadRequestError('Invalid or expired token');
    }

    if (user.passwordReset.expiresAt.getTime() < Date.now()) {
      user.passwordReset = undefined;
      await user.save({ session });
      throw new BadRequestError('Invalid or expired token');
    }

    const isValid = verifyToken(rawToken, user.passwordReset.tokenHash);
    if (!isValid) {
      throw new BadRequestError('Invalid or expired token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedResult = await UserModel.findOneAndUpdate(
      { _id: user._id, 'passwordReset.tokenHash': hash },
      {
        $set: {
          passwordHash: hashedPassword,
          passwordReset: undefined,
          lastPasswordChangeAt: new Date(),
        },
        $push: {
          changeHistory: {
            $each: [
              {
                field: 'password',
                by: user._id,
                from: null,
                to: null,
                reason: 'User reset the password via password reset',
                at: new Date(),
                via: 'user',
              },
            ],
            $slice: -100,
          },
        },
      },
      { session }
    );
    if (!updatedResult) {
      throw new BadRequestError('Token already used or invalid');
    }
    await SessionModel.updateMany(
      { userId: user._id },
      {
        valid: false,
        revokedAt: new Date(),
      },
      { session }
    );
    emailPayload = updatedResult;
  });

  //TODO: enqueue password changed email
  if (emailPayload) {
    sendPasswordUpdatedEmail(emailPayload);
  }
}

export async function sendEmailVerification(userId: string): Promise<void> {
  const user: User | null = await UserModel.findById(userId).select('+emailVerification +changeHistory');
  if (!user) {
    throw new NotFoundError('User not found');
  }
  const active = ensureActiveAccount(user);
  if (!active) {
    throw new ForbiddenError('Account is not active');
  }
  if (user.emailVerified) {
    throw new ConflictError('Email is already verified');
  }

  const token = generateVerificationToken();

  const verifyEmailUrl = `${process.env.APP_URL}/verify-email?token=${encodeURIComponent(token.raw)}`;

  await UserModel.updateOne(
    { _id: user._id },
    {
      $set: {
        emailVerification: {
          tokenHash: token.hash,
          expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
          requestedAt: new Date(),
        },
      },
      $push: {
        changeHistory: {
          $each: [
            {
              field: 'email',
              by: user._id,
              reason: 'User requested email verification',
              at: new Date(),
              via: 'user',
            },
          ],
          $slice: -100,
        },
      },
    }
  );
  sendVerificationEmail(user, verifyEmailUrl);
  return;
}

export async function verifyEmail(verificationToken: string): Promise<void> {
  const hash = hashToken(verificationToken);
  const user: User | null = await UserModel.findOne({
    'emailVerification.tokenHash': hash,
  }).select('+emailVerification +changeHistory');
  if (!user) {
    throw new BadRequestError('Invalid or expired verification token');
  }
  const active = ensureActiveAccount(user);
  if (!active) {
    throw new ForbiddenError('Account is not active');
  }

  if (
    !user.emailVerification ||
    !user.emailVerification.tokenHash ||
    !user.emailVerification.expiresAt ||
    user.emailVerification.expiresAt!.getTime() < Date.now()
  ) {
    user.emailVerification = undefined;
    await user.save();
    throw new BadRequestError('Invalid or expired verification token');
  }
  const isValid = verifyToken(verificationToken, user.emailVerification.tokenHash);
  if (!isValid) {
    throw new BadRequestError('Invalid or expired verification token');
  }
  await UserModel.findOneAndUpdate(
    { _id: user._id, 'emailVerification.tokenHash': hash },
    {
      $set: { emailVerified: true, emailVerification: undefined },
      $push: {
        changeHistory: {
          $each: [
            {
              field: 'email',
              from: 'unverified',
              to: 'verified',
              by: user._id,
              reason: 'User verified their email',
              at: new Date(),
              via: 'user',
            },
          ],
          $slice: -100,
        },
      },
    }
  );
  return;
}

export async function verifyUpdateEmail(
  verificationToken: string,
  code: string,
  currentSessionId?: string
): Promise<void> {
  const hash = hashToken(verificationToken);

  return withTransaction(async (session) => {
    const user: User | null = await UserModel.findOne({
      'pendingEmailChange.tokenHash': hash,
    })
      .select('+pendingEmailChange +changeHistory')
      .session(session);
    if (!user) {
      throw new BadRequestError('Invalid or expired verification token');
    }
    const active = ensureActiveAccount(user);
    if (!active) {
      throw new ForbiddenError('Account is not active');
    }
    if (
      !user.pendingEmailChange ||
      !user.pendingEmailChange.expiresAt ||
      user.pendingEmailChange.expiresAt!.getTime() < Date.now() ||
      !user.pendingEmailChange.tokenHash ||
      !user.pendingEmailChange.newEmail ||
      !user.pendingEmailChange.code
    ) {
      user.pendingEmailChange = undefined;
      await user.save({ session });
      throw new BadRequestError('Invalid or expired verification token');
    }
    const isValid = verifyToken(verificationToken, user.pendingEmailChange.tokenHash);
    if (!isValid) {
      throw new BadRequestError('Invalid or expired verification token');
    }
    const codeMatches = await bcrypt.compare(code, user.pendingEmailChange.code);
    if (!codeMatches) {
      throw new BadRequestError('Invalid verification code');
    }
    await UserModel.updateOne(
      { _id: user._id },
      {
        $set: {
          email: user.pendingEmailChange.newEmail,
          emailVerified: true,
          pendingEmailChange: undefined,
        },
        $push: {
          changeHistory: {
            $each: [
              {
                field: 'email',
                from: user.email,
                to: user.pendingEmailChange.newEmail,
                by: user._id,
                reason: 'User verified email change',
                at: new Date(),
                via: 'user',
              },
            ],
            $slice: -100,
          },
        },
      },
      { session }
    );

    await SessionModel.updateMany(
      { userId: user._id, sessionId: { $ne: currentSessionId } },
      {
        valid: false,
        revokedAt: new Date(),
      },
      { session }
    );
  });
}

export async function logoutUser(refreshToken: string) {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as {
      userId: string;
      sessionId: string;
    };
  } catch (err) {
    throw new UnauthenticatedError('Authentication failed');
  }
  const session = await SessionModel.findOne({
    sessionId: decoded.sessionId,
    userId: decoded.userId,
    valid: true,
  });
  if (!session) {
    throw new NotFoundError('Session not found');
  }
  session.revokedAt = new Date();
  session.valid = false;
  await session.save();
  return;
}
