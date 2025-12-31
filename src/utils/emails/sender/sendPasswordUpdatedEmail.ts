import { User } from "@models/User.js";
import transporter from "config/mail.js";
import { passwordChangedNotificationTemplate } from "../templates/passwordChangedNotification.js";
import logger from "@utils/logger.js";

const sendPasswordUpdatedEmail = async (user: User) => {
  const { subject, text, html } = passwordChangedNotificationTemplate(
    user.displayName || user.username || null
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
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error(
      `Failed to send password updated email to ${user.email}: ${errorMessage}`
    );
  }
};

export default sendPasswordUpdatedEmail;
