import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['node_modules', 'dist', 'coverage', 'src/content/data'] },
  ...tseslint.configs.recommended,
  {
    rules: {
      // ADR-0008 / CLAUDE.md: `any` is banned; use `unknown` and validate.
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
)
