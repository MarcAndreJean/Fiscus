# Fiscus mobile app

Expo / React Native app (iOS, Android, web) for the Fiscus accounting API: business, car and house expenses, incomes, travel logs and misc files, with create, edit, delete, attachments and Excel reports.

## Getting started

Prerequisites: [Node.js](https://nodejs.org/) 20.18.1 or newer (`nvm use` reads `.nvmrc`) and Yarn 1 (or use `npm run` for the scripts).

```bash
cd mobile-app
yarn install
cp .env.sample .env   # fill it in, see below
yarn start            # press w for the web, or open the dev build / Expo Go
```

### Settings and `.env`

On iOS and Android the API settings (URL, key, ids) are entered in the app (Settings tab) and stored in the device's secure store, so a new API URL needs no new build. To have the URL pre-filled, set `DEFAULT_API_URL` in `lib/config.ts` (empty by default; `EXPO_PUBLIC_API_URL`, when set, wins over it). The web build has no secure store and reads them from `.env`:

| Variable                                                                   | Meaning                                                                                                                                           |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`                                                      | API base URL, e.g. `https://<id>.execute-api.<region>.amazonaws.com/prod` (web; on iOS and Android only the starting value of the Settings field) |
| `EXPO_PUBLIC_SECRET_KEY`                                                   | API key (web only)                                                                                                                                |
| `EXPO_PUBLIC_USER_ID`                                                      | Your user id (web only)                                                                                                                           |
| `EXPO_PUBLIC_BUSINESS_IDS`, `EXPO_PUBLIC_CAR_IDS`, `EXPO_PUBLIC_HOUSE_IDS` | Comma-separated ids (web only)                                                                                                                    |
| `EXPO_PUBLIC_HAS_TPS`, `EXPO_PUBLIC_HAS_TVQ`                               | `true` / `false`: default taxes for new entries (web only)                                                                                        |

`EXPO_PUBLIC_*` values are compiled into the JavaScript bundle, so a web build contains the key it was built with: do not publish it.

## Scripts

| Command                             | What it does                                |
| ----------------------------------- | ------------------------------------------- |
| `yarn start` / `yarn web`           | Dev server                                  |
| `yarn typecheck`                    | `tsc --noEmit`                              |
| `yarn lint` / `yarn lint:fix`       | ESLint (zero warnings allowed) / with fixes |
| `yarn format` / `yarn format:check` | Prettier write / check                      |
| `yarn test` / `yarn test:watch`     | Jest unit tests                             |

The repo's git pre-commit hook (see `/.pre-commit-config.yaml`, install with `pre-commit install` at the repo root) runs Prettier, ESLint, the type check and the tests whenever app files change. Nothing runs on GitHub: the workflows in `.github/` are kept but inactive (see `.github/README.md`).

## Code layout

```
app/                      routes (expo-router): tabs, <kind>-form and <kind>-details modals
lib/
  config.ts               DEFAULT_API_URL: the API URL pre-filled in Settings
  api/                    the only code that talks HTTP
    client.ts             axios client: unwraps {statusCode, message, data}, throws ApiError
    entities.ts           generic list / create / update / delete hooks (React Query)
    <entity>.ts           typed hooks per entity (useExpenses, useUpdateIncome, ...)
    files.ts, reports.ts  uploads, download URLs, Excel reports
  settings/               SettingsProvider, useSettings, useAuth (loaded once)
  context/                current business/car/house, year and Business tab section
  navigation/             detailsRoute / formRoute and the modal screen list
  types/                  API models; Update/Delete models are derived from Create/Data
  ui/components/
    shared/               EntityListPage, EntityListItem, EntityViewer, FormScreen, dialogs
    inputs/               AmountInput, AttachmentsField, OwnerDropdown, file pickers
    <entity>/             list page, details fields, form and its pure form models
  utils/                  amounts and taxes, number parsing, formatting, file helpers
  locales/                English strings (every UI string goes through Locales.t)
```

### Adding an entity kind

1. Types in `lib/types/<Entity>Models.ts` (Data, Create, Update, Delete).
2. `lib/api/<entity>.ts`: a parser and the typed hooks over `entities.ts`.
3. `lib/ui/components/<entity>/`: `<entity>Fields.ts` (details rows), `<entity>FormModels.ts` with tests, the form and the list page.
4. Routes `app/<kind>-form.tsx` and `app/<kind>-details.tsx`, an entry in `lib/navigation/routes.ts`, and a section in `lib/context/businessModes.ts`.

## Native builds (EAS)

Builds run on Expo's servers and use EAS build credits. Before the first build, set up your own copy:

- **App id** (Android package and iOS bundle id): `com.fiscus.app` by default, set in `app.config.ts`. Use your own: change `DEFAULT_APP_ID` there, or set `FISCUS_APP_ID` (in `.env` for local builds, as an EAS environment variable with `eas env:create` for EAS builds). A phone only upgrades an installed app with the same id; a new id installs a separate app whose settings are entered again.
- **EAS project**: `extra.eas.projectId` in `app.json` links the app to an Expo project whose slug must be `fiscus`. For your own copy, run `eas init` to create a project and write its id.

Builds are only started by hand:

```bash
npm install --global eas-cli
eas login
eas build --platform android --profile production   # APK
eas build --platform ios --profile production       # IPA
eas build --platform ios --profile adhoc            # AltStore
eas build --platform android --profile development  # dev client
```

Upgrading Expo: https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/

## License

[PolyForm Noncommercial License 1.0.0](LICENSE), the same as the rest of the repo.
