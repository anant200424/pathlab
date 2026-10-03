import dotenv from "dotenv";
import { z } from "zod";

// Load .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(5000),
  API_PREFIX: z.string().default("/api/v1"),

  // Database
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  MONGODB_MAX_POOL_SIZE: z.coerce.number().default(50),
  MONGODB_MIN_POOL_SIZE: z.coerce.number().default(5),

  // CORS
  FRONTEND_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://localhost:5173"),

  // Session & Security
  SESSION_SECRET: z
    .string()
    .min(16, "SESSION_SECRET must be at least 16 characters"),
  SESSION_TTL_HOURS: z.coerce.number().default(24),
  COOKIE_NAME: z.string().default("labcare_session"),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  COOKIE_DOMAIN: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().default(15),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(500),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(10),

  // Storage
  OBJECT_STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
  OBJECT_STORAGE_LOCAL_DIR: z.string().default("./storage/uploads"),
  OBJECT_STORAGE_ENDPOINT: z.string().optional(),
  OBJECT_STORAGE_REGION: z.string().default("us-east-1"),
  OBJECT_STORAGE_BUCKET: z.string().default("labcare-pro-private-assets"),
  OBJECT_STORAGE_ACCESS_KEY: z.string().optional(),
  OBJECT_STORAGE_SECRET_KEY: z.string().optional(),
  OBJECT_STORAGE_PUBLIC_BASE_URL: z.string().optional(),

  // Logging
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),

  // Integrations (optional / stubs)
  EMAIL_PROVIDER_ENABLED: z.coerce.boolean().default(false),
  EMAIL_SMTP_HOST: z.string().optional(),
  EMAIL_SMTP_PORT: z.coerce.number().optional(),
  EMAIL_SMTP_USER: z.string().optional(),
  EMAIL_SMTP_PASS: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.string().default("noreply@labcarepro.internal"),

  SMS_PROVIDER_ENABLED: z.coerce.boolean().default(false),
  SMS_PROVIDER_API_KEY: z.string().optional(),
  SMS_PROVIDER_SENDER_ID: z.string().optional(),

  PAYMENT_GATEWAY_ENABLED: z.coerce.boolean().default(false),
  PAYMENT_GATEWAY_KEY_ID: z.string().optional(),
  PAYMENT_GATEWAY_KEY_SECRET: z.string().optional(),
  PAYMENT_GATEWAY_WEBHOOK_SECRET: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

let parsedEnv: EnvConfig;

try {
  // If in test environment and MONGODB_URI is not provided, provide a placeholder for vitest / in-memory mongo
  if (process.env.NODE_ENV === "test" && !process.env.MONGODB_URI) {
    process.env.MONGODB_URI = "mongodb://localhost:27017/labcare_test";
  }
  if (!process.env.SESSION_SECRET) {
    process.env.SESSION_SECRET =
      "labcare-pro-default-development-secret-key-32chars";
  }

  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const formattedErrors = error.errors
      .map((e) => `  - ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    console.error(
      "CRITICAL: Invalid environment configuration:\n" + formattedErrors,
    );
  } else {
    console.error("CRITICAL: Unexpected error parsing environment:", error);
  }
  process.exit(1);
}

export const env = parsedEnv;
