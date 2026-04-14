import type { User } from '@models/User.js';
import type { UserReturnType } from '@app-types/index.js';

/**
 * Sanitizes a User document before sending it to the frontend.
 * Never exposes: userId (_id as raw ObjectId), passwordHash, passwordReset,
 * emailVerification, pendingEmailChange, changeHistory, or any internal fields.
 */
export const sanitizeUserResponse = (user: User, type: UserReturnType) => {
  switch (type) {
    case 'profile':
      return {
        id: user._id.toString(),

        email: user.email,
        username: user.username,
        displayName: user.displayName ?? null,
        bio: user.bio ?? null,
        avatarUrl: user.avatarUrl ?? null,

        role: user.role,

        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        twoFactorEnabled: user.twoFactorEnabled,

        accountStatus: user.accountStatus,
        billingStatus: user.billingStatus,
        cancelAtPeriodEnd: user.cancelAtPeriodEnd,

        links: {
          website: user.links?.website ?? null,
          youtube: user.links?.youtube ?? null,
          twitter: user.links?.twitter ?? null,
          instagram: user.links?.instagram ?? null,
          linkedin: user.links?.linkedin ?? null,
          facebook: user.links?.facebook ?? null,
          github: user.links?.github ?? null,
        },

        oauthProviders: user.oauthProviders ?? [],

        notificationPrefs: {
          emailOnJobComplete: user.notificationPrefs?.emailOnJobComplete ?? true,
          inApp: user.notificationPrefs?.inApp ?? true,
          marketingEmails: user.notificationPrefs?.marketingEmails ?? false,
        },

        privacyPrefs: {
          profileVisibility: user.privacyPrefs?.profileVisibility ?? 'private',
          showEmailOnProfile: user.privacyPrefs?.showEmailOnProfile ?? false,
          showLinksOnProfile: user.privacyPrefs?.showLinksOnProfile ?? true,
        },

        createdAt: user.createdAt,
      };

    case 'settings':
      return {
        email: user.email,
        username: user.username,
        displayName: user.displayName ?? null,
        avatarUrl: user.avatarUrl ?? null,
        bio: user.bio ?? null,
        plan: user.currentPlan,
        privacyPrefs: user.privacyPrefs ?? {},
        notificationPrefs: user.notificationPrefs ?? {},
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
      };

    case 'account':
      return {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        displayName: user.displayName ?? null,
        avatarUrl: user.avatarUrl ?? null,
        role: user.role,
        accountStatus: user.accountStatus,
        createdAt: user.createdAt,
      };

    default:
      return {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName ?? null,
        avatarUrl: user.avatarUrl ?? null,
      };
  }
};
