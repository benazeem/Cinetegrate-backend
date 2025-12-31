import transporter from "config/mail.js";
import { verifyUpdatedEmailTemplate } from "../templates/verifyUpdatedEmail.js";
import { InternalServerError } from "@middleware/error/index.js";
import { User } from "@models/User.js";
import logger from "@utils/logger.js";

const sendUpdateEmailLink = async (
  user: Partial<User>,
  newEmail: string,
  updateEmailUrl: string
): Promise<void> => {
  const { subject, text, html } = verifyUpdatedEmailTemplate(
    user.displayName ?? user.username ?? null,
    updateEmailUrl
  );

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: newEmail,
      subject: subject,
      text: text,
      html: html,
    });
  } catch (error) {
    logger.error(
      {
        email: newEmail,
        error,
      },
      "Failed to send update email link"
    );
  }
};

export default sendUpdateEmailLink;
