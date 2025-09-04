/* eslint-env node */
module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  env: {
    node: true,
    es2022: true,
  },
  plugins: ['import', 'unused-imports'],
  extends: ['eslint:recommended', 'plugin:import/recommended', 'prettier'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],
      },
    },
  },
  rules: {
    'unused-imports/no-unused-imports': 'warn',
    'no-console': 'off',
  },
  ignorePatterns: ['dist', 'build', 'out', 'node_modules'],
};

