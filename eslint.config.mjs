// Next.js 16 ships eslint-config-next as a native flat config (array).
// Spread it, then layer our house rules. typescript-eslint is a transitive
// dep of eslint-config-next; register its plugin so our TS rules resolve.
import next from "eslint-config-next"
import tseslint from "typescript-eslint"

const eslintConfig = [
  ...next,
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: { "@typescript-eslint": tseslint.plugin },
    rules: {
      // CLAUDE.md: no `any`, no silent escape hatches.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "src/db/migrations/**",
      "docs/**", // copied design-bundle prototypes — reference only, not linted
      "next-env.d.ts",
    ],
  },
]

export default eslintConfig
