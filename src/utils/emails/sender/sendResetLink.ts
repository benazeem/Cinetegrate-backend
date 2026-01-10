import { User } from "@models/User.js";
import transporter from "config/mail.js";
import { RESET_EXP_MIN } from "constants/authConsts.js";
import { resetPasswordTemplate } from "../templates/resetPassword.js";
import logger from "@utils/logger.js";

const sendResetLink = async (user: User, resetUrl: string) => {
  const { subject, text, html } = resetPasswordTemplate(
    user.displayName || user.username || user.email.split("@")[0],
    resetUrl,
    RESET_EXP_MIN
  );
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject,
      text,
      html,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error(
      `Failed to send reset password email to ${user.email}: ${errorMessage}`
    );
  }
};
export default sendResetLink;
