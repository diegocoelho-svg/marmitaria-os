import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/main/server.ts'],
  format: 'esm',
  platform: 'node',
  target: 'node24',
  noExternal: [/^@marmitaria\//],
  clean: true,
})
