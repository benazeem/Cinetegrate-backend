import transporter from "config/mail.js";
import { verifyOldEmailForEmailUpdate } from "../templates/verifyOldEmailForEmailUpdate.js";
import logger from "@utils/logger.js";
import { User } from "@models/User.js";

const sendOldEmailVerificationForEmailUpdate = async (
  user: Partial<User>,
  verificationCode: string
): Promise<void> => {
  const { subject, text, html } = verifyOldEmailForEmailUpdate(
    user.displayName ?? user.username ?? null,
    verificationCode
  );

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email, // OLD email
      subject,
      text,
      html,
    });
  } catch (err) {
    logger.error(
      {
        email: user.email,
        err,
      },
      "Failed to send old email verification code"
    );
  }
};

export default sendOldEmailVerificationForEmailUpdate;
