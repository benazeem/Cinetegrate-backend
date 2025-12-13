export function emailVerificationTemplate(
  displayName: string | null,
  verifyEmailUrl: string
) {
  const subject = "Verify your email address · Cinetegrate 🎬";

  const text = `
Hi ${displayName ?? ""},

Welcome to Cinetegrate.

Please verify your email address to complete your account setup.
This helps us keep your account secure and ensures you don’t miss important updates.

Verify your email using the link below (valid for 1 hour):
${verifyEmailUrl}

If you didn’t create this account, you can safely ignore this email.
  `.trim();

  const html = `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; line-height: 1.7; color: #222;">
      <h2 style="margin-bottom: 8px;">
        Verify your email
        <span style="color:#2d7df4;"> · Cinetegrate</span> 🎬
      </h2>

      <p style="margin: 0 0 12px;">
        Hi ${displayName ?? ""},
      </p>

      <p style="margin: 0 0 12px;">
        Thanks for joining Cinetegrate.
        Before we roll the credits, we just need to confirm that this email address belongs to you.
      </p>

      <p style="margin: 0 0 16px;">
        Click the button below to verify your email.  
        This link is valid for <strong>1 hour</strong>.
      </p>

      <p style="margin: 20px 0;">
        <a
          href="${verifyEmailUrl}"
          style="
            display: inline-block;
            padding: 12px 20px;
            background-color: #2d7df4;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
          "
        >
          Verify Email Address
        </a>
      </p>

      <p style="margin: 16px 0 12px; font-size: 14px; color: #555;">
        If the button doesn’t work, copy and paste this link into your browser:
        <br />
        <a href="${verifyEmailUrl}" style="color:#2d7df4; word-break: break-all;">
          ${verifyEmailUrl}
        </a>
      </p>

      <p style="margin: 0 0 12px;">
        If you didn’t create this account, you can safely ignore this message.
      </p>

      <p style="opacity: 0.75; margin-top: 24px; font-size: 14px;">
        Lights. Camera. Integrate. ✨
      </p>
    </div>
  `;

  return { subject, text, html };
}
