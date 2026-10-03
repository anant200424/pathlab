import pino from "pino";
import { env } from "../../config/env.js";

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      'req.headers["set-cookie"]',
      "headers.authorization",
      "headers.cookie",
      "password",
      "currentPassword",
      "newPassword",
      "confirmPassword",
      "token",
      "sessionToken",
      "refreshToken",
      "secret",
      "apiKey",
      "cvv",
      "cardNumber",
      "patientName",
      "patientPhone",
      "patientEmail",
      "*.password",
      "*.*.password",
      "*.token",
      "*.*.token",
    ],
    censor: "[REDACTED]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport:
    env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});
