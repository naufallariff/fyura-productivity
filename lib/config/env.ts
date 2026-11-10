import "server-only";
import { z } from "zod";

const hexKey64 = /^[0-9a-f]{64}$/i;

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Application
  APP_URL: z.string().url(),
  DEFAULT_TIMEZONE: z.string().min(1).default("Asia/Jakarta"),

  // Database
  // Runtime connection: role app_runtime, transaction pooler (port 6543)
  DATABASE_URL: z.string().min(1),
  // Migration connection: role postgres, session pooler (port 5432). Optional at runtime.
  DATABASE_URL_MIGRATE: z.string().min(1).optional(),

  // Auth.js and Google OAuth
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),
  // Comma-separated list of emails allowed to sign in
  ALLOWED_EMAILS: z
    .string()
    .min(3)
    .transform((s) =>
      s
        .split(",")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean),
    )
    .pipe(
      z.array(z.string().email()).min(1, "ALLOWED_EMAILS must contain at least one valid email"),
    ),

  // Private space
  PRIVATE_PIN_PEPPER: z.string().min(32, "PRIVATE_PIN_PEPPER must be at least 32 characters"),
  // AES-256 key for private columns: 64 hexadecimal characters (32 bytes)
  ENCRYPTION_KEY: z
    .string()
    .regex(hexKey64, "ENCRYPTION_KEY must be exactly 64 hexadecimal characters"),
  ENCRYPTION_KEY_VERSION: z.coerce.number().int().positive().default(1),

  // Cron
  CRON_SECRET: z.string().min(32, "CRON_SECRET must be at least 32 characters"),

  // Observability: Sentry is disabled when the DSN is empty
  SENTRY_DSN: z
    .string()
    .url()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

// Evaluated once, when the module is first loaded on the server.
export const env: Env = loadEnv();
