export function passwordChangedNotificationTemplate(
  displayName: string | null
) {
  const subject = "Your password was changed · Cinetegrate 🔒";

  const text = `
Hi ${displayName ?? ""},

This is a confirmation that the password for your Cinetegrate account was just changed.

If you made this change, no further action is needed.

If you did NOT change your password, please secure your account immediately by resetting your password and reviewing your active sessions.

— The Cinetegrate Team
  `.trim();

  const html = `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; line-height: 1.7; color: #222;">
      <h2 style="margin-bottom: 8px;">
        Password changed
        <span style="color:#2d7df4;"> · Cinetegrate</span> 🔒
      </h2>

      <p style="margin: 0 0 12px;">
        Hi ${displayName ?? ""},
      </p>

      <p style="margin: 0 0 12px;">
        This is a confirmation that the password for your Cinetegrate account
        was recently changed.
      </p>

      <p style="margin: 0 0 12px;">
        If you made this change, no further action is required.
      </p>

      <p style="margin: 0 0 16px;">
        If you did <strong>not</strong> change your password, we recommend that you:
      </p>

      <ul style="margin: 0 0 16px; padding-left: 20px; color: #444;">
        <li>Reset your password immediately</li>
        <li>Review and revoke any active sessions</li>
        <li>Contact support if you notice anything unusual</li>
      </ul>

      <p style="opacity: 0.75; margin-top: 24px; font-size: 14px;">
        Stay secure,<br />
        The Cinetegrate Team ✨
      </p>
    </div>
  `;

  return { subject, text, html };
}
