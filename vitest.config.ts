import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'node:path'

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      // `server-only` is a Next.js poison-pill package that throws when a
      // client module transitively imports a server module. Under vitest
      // there's no client/server boundary, so stub it out to prevent the
      // package from aborting the whole test run.
      'server-only': path.resolve(__dirname, 'src/tests/server-only.stub.ts'),
    },
  },
  test: {
    exclude: ['**/*.spec.ts', 'node_modules/**/*']
  }
})
