import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infrastructure/database/postgresql/schema/index.ts',
  out: './drizzle',
})
