import { z } from 'zod';

const checkPostgresUrl = (v: string) =>
  v.startsWith('postgres://') || v.startsWith('postgresql://');
const checkHttpUrl = (v: string) => v.startsWith('http://') || v.startsWith('https://');

export const envSchema = z.object({
  // * App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),

  // * Docker Ports
  LEAD_HANDLER_APP_PORT: z.coerce.number().default(4000),
  LEAD_HANDLER_FRONTEND_PORT: z.coerce.number().default(3000),

  // * Database
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_PASSWORD_ENCODED: z.string().min(1),
  DATABASE_URL: z.url().refine(checkPostgresUrl),
  DATABASE_URL_POSTGRES: z.url().refine(checkPostgresUrl),

  // * Auth
  JWT_SECRET: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(1),

  // * External APIs
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  SMSCLUB_API_KEY: z.string().min(1),

  // # CRM URLs
  ROBOTNIK_URL: z.url().refine(checkHttpUrl),
  ROBOTNIK_GEOIP_URL: z.url().refine(checkHttpUrl),
  ALTERCPA_GET_STATUSES_URL: z.url().refine(checkHttpUrl),
  HUSTLE_TEAM_ROBOTNIK_URL: z.url().refine(checkHttpUrl),

  // Buyer Tokens
  VLASNYK_TOKEN: z.string().min(1),
  LEGKOKBBB_TOKEN: z.string().min(1),
  TAIPAN_TOKEN: z.string().min(1),
  ONION_TOKEN: z.string().min(1),
  LONDON_TOKEN: z.string().min(1),
  POOL_TOKEN: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

export function validate(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Environment validation failed:\n${formatted}`);
  }

  return parsed.data;
}
