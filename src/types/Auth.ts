// ── Auth response types ───────────────────────────────────────────────────────

/** Safe user shape returned to controllers after register/login. Never includes _id. */
export type SignOutput = {
  user: {
    email: string;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    accountStatus: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    csrfToken: string;
  };
};

export interface RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
}
