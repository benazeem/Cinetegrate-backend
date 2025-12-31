import { newAccountTemplate } from "../templates/newAccount.js";
import transporter from "config/mail.js";

const sendWelcomeEmail = async (
  email: string,
  displayName?: string,
  username?: string
) => {
  const { subject, text, html } = newAccountTemplate(
    displayName || username || email.split("@")[0]
  );
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject,
      text,
      html,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`Failed to send welcome email:${errorMessage}`);
  }
};

export default sendWelcomeEmail;
