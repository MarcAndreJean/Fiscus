import type { ConfigContext, ExpoConfig } from 'expo/config'

/**
 * The app's store id: the Android package and the iOS bundle identifier. Change it here, or
 * set FISCUS_APP_ID (in .env for local builds, as an EAS environment variable for EAS
 * builds). Phones only upgrade an installed app with the same id.
 */
const DEFAULT_APP_ID = 'com.fiscus.app'

const appId = process.env.FISCUS_APP_ID || DEFAULT_APP_ID

// Everything else comes from app.json.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'Fiscus',
  slug: config.slug ?? 'fiscus',
  android: { ...config.android, package: appId },
  ios: { ...config.ios, bundleIdentifier: appId },
})
