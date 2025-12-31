import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",

  formatters: {
    level(label) {
      return { level: label };
    },
  },

  timestamp: () => `,"time":"${new Date().toISOString()}"`,

  redact: {
    paths: [
      "password",
      "passwordHash",
      "token",
      "accessToken",
      "refreshToken",
      "csrfToken",
      "authorization",
      "headers.authorization",
    ],
    censor: "[REDACTED]",
  },

  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "yyyy-mm-dd HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }),
});

export default logger;
