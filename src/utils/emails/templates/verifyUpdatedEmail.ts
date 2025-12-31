export function verifyUpdatedEmailTemplate(
  displayName: string | null,
  verifyEmailUrl: string
) {
  const subject = "Confirm your new email address · Cinetegrate 🎬";

  const text = `
Hi ${displayName ?? ""},

You recently requested to change the email address associated with your Cinetegrate account.

To confirm this change, please verify your new email address using the link below.
This link is valid for 1 hour.

${verifyEmailUrl}

If you did not request this change, you can safely ignore this email.
Your existing email address will remain unchanged.
  `.trim();

  const html = `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; line-height: 1.7; color: #222;">
      <h2 style="margin-bottom: 8px;">
        Confirm your new email
        <span style="color:#2d7df4;"> · Cinetegrate</span> 🎬
      </h2>

      <p style="margin: 0 0 12px;">
        Hi ${displayName ?? ""},
      </p>

      <p style="margin: 0 0 12px;">
        You recently requested to change the email address linked to your Cinetegrate account.
      </p>

      <p style="margin: 0 0 16px;">
        To complete this change, please confirm your new email address by clicking the button below.
        This link will expire in <strong>30 minutes</strong>.
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
          Confirm New Email
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
        If you did not request this change, you can safely ignore this message.
        Your current email address will remain active.
      </p>

      <p style="opacity: 0.75; margin-top: 24px; font-size: 14px;">
        Stay secure,<br />
        The Cinetegrate Team ✨
      </p>
    </div>
  `;

  return { subject, text, html };
}
