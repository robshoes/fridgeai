// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    // Deno runtime (Edge Functions): different module resolution/globals,
    // linted separately via `deno lint` rather than this ESLint config.
    ignores: ['dist/*', 'supabase/functions/**'],
  },
]);
