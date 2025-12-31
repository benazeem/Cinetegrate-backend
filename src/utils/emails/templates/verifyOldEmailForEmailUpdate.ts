export function verifyOldEmailForEmailUpdate(
  displayName: string | null,
  verificationCode: string
) {
  const subject = "Security check: confirm email change · Cinetegrate 🔐";

  const text = `
Hi ${displayName ?? ""},

We received a request to change the email address on your Cinetegrate account.

To confirm this change, please enter the verification code below when prompted:

Verification code:
${verificationCode}

This code is valid for 10 minutes.

If you did NOT request this change, someone may be trying to access your account.
We recommend reviewing your security settings immediately.

— Cinetegrate Security Team
  `.trim();

  const html = `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; line-height: 1.7; color: #222;">
      <h2 style="margin-bottom: 8px;">
        Confirm email change
        <span style="color:#b00020;"> · Security Check</span> 🔐
      </h2>

      <p style="margin: 0 0 12px;">
        Hi ${displayName ?? ""},
      </p>

      <p style="margin: 0 0 12px;">
        We received a request to change the email address associated with your
        Cinetegrate account.
      </p>

      <p style="margin: 0 0 12px;">
        To approve this change, please enter the verification code below when prompted:
      </p>

      <div
        style="
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 6px;
          margin: 20px 0;
          padding: 12px 16px;
          background: #f5f5f5;
          display: inline-block;
          border-radius: 6px;
        "
      >
        ${verificationCode}
      </div>

      <p style="margin: 12px 0; font-size: 14px; color: #555;">
        This code is valid for <strong>10 minutes</strong>.
      </p>

      <p style="margin: 16px 0 12px; color:#b00020; font-weight: 500;">
        If you did NOT request this change, do not share this code with anyone.
        Review your account security immediately.
      </p>

      <p style="opacity: 0.75; margin-top: 24px; font-size: 14px;">
        Cinetegrate Security Team
      </p>
    </div>
  `;

  return { subject, text, html };
}
