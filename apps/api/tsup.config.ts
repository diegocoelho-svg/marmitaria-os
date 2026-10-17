import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/server.ts', 'src/migrate.ts'],
  format: 'esm',
  platform: 'node',
  target: 'node24',
  noExternal: [/^@marmitaria\//],
  clean: true,
})
