export function resetPasswordTemplate(
  displayName: string | null,
  resetUrl: string,
  expiresInMinutes: number
) {
  const subject = "Reset your Cinetegrate password";

  const text = `
Hi ${displayName ?? ""},

You requested a password reset for your Cinetegrate account.

Click the link below to create a new password:
${resetUrl}

This link expires in ${expiresInMinutes} minutes.

If you did not request this, simply ignore this email.
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <p>Hi ${displayName ?? ""},</p>

      <p>You requested a password reset for your Cinetegrate account.</p>

      <p>
        <a href="${resetUrl}" 
           style="
             display: inline-block; 
             padding: 10px 16px; 
             background: #2d7df4; 
             color: #fff; 
             text-decoration: none; 
             border-radius: 6px;
           ">
          Reset Password
        </a>
      </p>

      <p>This link expires in <strong>${expiresInMinutes} minutes</strong>.</p>

      <p>If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  return { subject, text, html };
}
