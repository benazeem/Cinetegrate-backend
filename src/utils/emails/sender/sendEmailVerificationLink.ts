import { User } from "@models/User.js";
import transporter from "config/mail.js";
import { emailVerificationTemplate } from "../templates/emailVerification.js";
import logger from "@utils/logger.js";

const sendVerificationEmail = async (
  user: Partial<User>,
  verifyEmailUrl: string
) => {
  const { subject, text, html } = emailVerificationTemplate(
    user.displayName ?? user.username ?? null,
    verifyEmailUrl
  );

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: subject,
      text: text,
      html: html,
    });
  } catch (err) {
    logger.error(
      `Failed to send email verification to ${user.email}: ${
        (err as Error).message
      }`
    );
  }
};
export default sendVerificationEmail;
