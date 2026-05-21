import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

/**
 * Zod-validated environment. Import `env` instead of reading process.env
 * directly so a missing/typo'd variable fails fast at boot, not at runtime.
 */
export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    AUTH_SECRET: z.string().min(32),
    AUTH_URL: z.string().url(),
    S3_ENDPOINT: z.string().url(),
    S3_REGION: z.string().min(1),
    S3_ACCESS_KEY: z.string().min(1),
    S3_SECRET_KEY: z.string().min(1),
    S3_BUCKET: z.string().min(1),
    EMAIL_TRANSPORT: z.enum(["console", "smtp"]).default("console"),
    EMAIL_FROM: z.string().min(1),
    // SMTP transport vars. Optional at the env layer; required at use time
    // when EMAIL_TRANSPORT=smtp (asserted in src/lib/email.ts).
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    // "true" enables TLS on connect (port 465); "false" uses STARTTLS (587).
    SMTP_SECURE: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
    SENTRY_DSN: z.string().url().optional(),
    PGBOSS_SCHEMA: z.string().default("pgboss"),
    ID_ENCRYPTION_KEY: z.string().min(1).optional(),
  },
  client: {},
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_REGION: process.env.S3_REGION,
    S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
    S3_SECRET_KEY: process.env.S3_SECRET_KEY,
    S3_BUCKET: process.env.S3_BUCKET,
    EMAIL_TRANSPORT: process.env.EMAIL_TRANSPORT,
    EMAIL_FROM: process.env.EMAIL_FROM,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SENTRY_DSN: process.env.SENTRY_DSN,
    PGBOSS_SCHEMA: process.env.PGBOSS_SCHEMA,
    ID_ENCRYPTION_KEY: process.env.ID_ENCRYPTION_KEY,
  },
  // CI runs typecheck/lint without a real env; skip validation there.
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
})
