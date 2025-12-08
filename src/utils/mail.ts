import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";


let transporter:Transporter;

if (process.env.NODE_ENV !== "production") {
  transporter = nodemailer.createTransport({
    host: process.env.DEV_SMTP_HOST,
    port: Number(process.env.DEV_SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.DEV_SMTP_USER,
      pass: process.env.DEV_SMTP_PASS,
    },
  });
} else {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export default transporter;