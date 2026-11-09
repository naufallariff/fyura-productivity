import "server-only";
import { z } from "zod";

const hexKey64 = /^[0-9a-f]{64}$/i;

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Aplikasi
  APP_URL: z.string().url(),
  DEFAULT_TIMEZONE: z.string().min(1).default("Asia/Jakarta"),

  // Database (Supabase Postgres, gunakan connection pooler)
  DATABASE_URL: z.string().min(1),

  // Auth.js dan Google OAuth (dipakai di batch B)
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET minimal 32 karakter"),
  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),
  // Daftar email yang diizinkan login, dipisah koma
  ALLOWED_EMAILS: z
    .string()
    .min(3)
    .transform((s) =>
      s
        .split(",")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().email()).min(1)),

  // Ruang privat (batch B dan fase 4)
  PRIVATE_PIN_PEPPER: z.string().min(32, "PRIVATE_PIN_PEPPER minimal 32 karakter"),
  // Kunci AES-256 untuk kolom privat, 64 karakter hex (32 byte)
  ENCRYPTION_KEY: z.string().regex(hexKey64, "ENCRYPTION_KEY harus 64 karakter hex"),
  ENCRYPTION_KEY_VERSION: z.coerce.number().int().positive().default(1),

  // Cron (fase 5)
  CRON_SECRET: z.string().min(32, "CRON_SECRET minimal 32 karakter"),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Konfigurasi environment tidak valid:\n${issues}`);
  }
  return parsed.data;
}

// Dievaluasi sekali saat modul pertama kali dimuat di server.
export const env: Env = loadEnv();
