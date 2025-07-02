# Git Hooks

This project uses Git hooks to ensure code quality and consistency. The hooks are managed using [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/okonet/lint-staged).

## Pre-commit Hook

The pre-commit hook runs before each commit and performs the following checks on staged files:

- For JavaScript files (\*.js):
  - ESLint checking and automatic fixing where possible
  - Prettier formatting

- For HTML files (\*.html):
  - HTML validation
  - Prettier formatting

- For JSON and Markdown files (_.json, _.md):
  - Prettier formatting

This ensures that all committed code follows project style guidelines and passes linting checks.

## Pre-push Hook

The pre-push hook runs before pushing changes to the remote repository and performs:

- Full codebase linting (HTML and JavaScript)
- All tests

This ensures that all code being pushed is fully validated and tested.

## Skipping Hooks

In rare cases where you need to bypass these hooks, you can use the `--no-verify` flag:

```bash
git commit --no-verify -m "Your commit message"
git push --no-verify
```

However, this should be used sparingly and only in exceptional circumstances.

## Troubleshooting

If you encounter any issues with the hooks:

1. Make sure Husky is properly installed: `npm run prepare`
2. Check that the hook scripts are executable: `chmod +x .husky/pre-commit .husky/pre-push`
3. Try running the checks manually: `npx lint-staged` or `npm run lint && npm test`
