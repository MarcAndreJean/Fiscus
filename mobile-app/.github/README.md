# Inactive workflows

These GitHub Actions workflows are kept for reference and are **inactive on purpose**:

- GitHub only runs workflows from `.github/workflows/` at the **repository root**, and this folder is inside `mobile-app/`.
- The `eas-*` workflows would spend EAS build credits.

Linting, formatting, type checks and tests run locally through the git pre-commit hook instead (see `.pre-commit-config.yaml` at the repo root).

To turn one on later, move it to `/.github/workflows/`. What each one still needs:

| Workflow                            | Ready once moved? | Still needed                                                                                                                                                   |
| ----------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eslint.yml`, `prettier.yml`        | Yes               | Nothing: they run in `mobile-app/`, take Node from `mobile-app/.nvmrc` and install with Yarn from `yarn.lock`.                                                 |
| `codeql.yml`                        | Yes               | Nothing. It scans JavaScript/TypeScript only; add `python` to its `matrix` to scan the backend too.                                                            |
| `eas-build.yml`                     | No                | An `EXPO_TOKEN` repository secret, your app id (`FISCUS_APP_ID`, see `app.config.ts`), and iOS credentials stored on EAS (a non-interactive build cannot ask). |
| `eas-update.yml`, `eas-reviews.yml` | No                | An `EXPO_TOKEN` repository secret and EAS Update set up in the app: `npx expo install expo-updates`, then `eas update:configure`, then a new build.            |
