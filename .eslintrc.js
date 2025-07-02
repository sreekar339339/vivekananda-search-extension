module.exports = {
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  env: {
    browser: true,
    es2022: true,
  },
  globals: {
    chrome: 'readonly',
  },
  extends: [
    'eslint:recommended',
    'prettier', // This will turn off ESLint rules that conflict with Prettier
  ],
  rules: {
    'no-unused-vars': 'off',
    'no-undef': 'off',
    'no-console': 'off',
    'no-useless-escape': 'off',
  },
};
