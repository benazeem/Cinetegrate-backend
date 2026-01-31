import type { User } from '@models/User.js';

type UserReturnType = 'profile' | 'settings' | 'security' | 'billing' | 'account';

export const sanitizeUserResponse = (user: User, type: UserReturnType) => {
  switch (type) {
    case 'profile':
      return {
        _id: user._id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? null,
        bio: user.bio ?? null,
        links: user.links ?? {},
        plan: user.currentPlan,
        emailVerified: user.emailVerified,
        usage: user.usage,
        accountStatus: user.accountStatus,
      };

    case 'settings':
      return {
        _id: user._id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? null,
        bio: user.bio ?? null,
        plan: user.currentPlan,
        privacyPrefs: user.privacyPrefs ?? {},
        notificationPrefs: user.notificationPrefs ?? {},
        usage: user.usage,
        links: user.links ?? {},
      };

    case 'security':
      return {
        email: user.email,
        phoneNumber: user.phoneNumber ?? null,
        passwordSet: true, // passwordHash is select:false, treat as always set
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        lastPasswordChangeAt: user.lastPasswordChangeAt,
        twofaEnabled: user.twoFactorEnabled,
        providers: user.oauthProviders ?? [],
      };

    case 'billing':
      return {
        plan: user.currentPlan,
        billingStatus: user.billingStatus ?? 'none',
        billingProvider: user.billingProvider ?? null,
        billingCustomerId: user.billingCustomerId ?? null,
        subscriptionId: user.subscriptionId ?? null,
        currentPeriodEnd: user.currentPeriodEnd ?? null,
        trialEndsAt: user.trialEndsAt ?? null,
        cancelAtPeriodEnd: user.cancelAtPeriodEnd ?? false,
        usage: user.usage,
      };

    case 'account':
      return {
        _id: user._id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? null,
        role: user.role,
        status: user.accountStatus, // enum: active, suspended, banned, deleted
        createdAt: user.createdAt,
      };
    default:
      return {
        _id: user._id,
        username: user.username,
        displayName: user.displayName ?? null,
        avatarUrl: user.avatarUrl ?? null,
      };
  }
};
