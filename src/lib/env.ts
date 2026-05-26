import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  CLIENT_URL: z.string().default("http://localhost:5173"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(z.treeifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
