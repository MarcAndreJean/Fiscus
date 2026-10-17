import { MaterialCommunityIcons } from '@expo/vector-icons'
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono'
import { NotoSans_400Regular } from '@expo-google-fonts/noto-sans'
import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavLightTheme,
  ThemeProvider,
} from '@react-navigation/native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import { SplashScreen, Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { useColorScheme } from 'react-native'
import { adaptNavigationTheme, PaperProvider } from 'react-native-paper'
import { en, registerTranslation } from 'react-native-paper-dates'

import {
  AppContextProvider,
  Locales,
  MODAL_SCREENS,
  SettingsProvider,
  StackHeader,
  Themes,
  useSettings,
} from '@/lib'

registerTranslation('en', en)
Locales.locale = 'en'

const ONE_HOUR_MS = 60 * 60 * 1000

// One cache for the whole app; lists stay fresh for an hour unless a save invalidates them.
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: ONE_HOUR_MS } },
})

// Catch any errors thrown by the Layout component.
export { ErrorBoundary } from 'expo-router'

// Ensure that reloading on `/modal` keeps a back button present.
export const unstable_settings = { initialRouteName: '(tabs)' }

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

const RootLayout = () => {
  const [loaded, error] = useFonts({
    NotoSans_400Regular,
    JetBrainsMono_400Regular,
    ...MaterialCommunityIcons.font,
  })

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  React.useEffect(() => {
    if (error) throw error
  }, [error])

  React.useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <AppContextProvider>
          <ThemedNavigation />
        </AppContextProvider>
      </SettingsProvider>
    </QueryClientProvider>
  )
}

const ThemedNavigation = () => {
  const colorScheme = useColorScheme()
  const { settings } = useSettings()

  const scheme =
    settings.theme === 'auto' ? (colorScheme ?? 'dark') : settings.theme
  const theme = Themes[scheme][settings.color]

  const { DarkTheme, LightTheme } = adaptNavigationTheme({
    reactNavigationDark: NavDarkTheme,
    reactNavigationLight: NavLightTheme,
    materialDark: Themes.dark[settings.color],
    materialLight: Themes.light[settings.color],
  })

  return (
    <ThemeProvider
      value={
        scheme === 'light'
          ? { ...LightTheme, fonts: NavLightTheme.fonts }
          : { ...DarkTheme, fonts: NavDarkTheme.fonts }
      }
    >
      <PaperProvider theme={theme}>
        <Stack
          screenOptions={{
            animation: 'slide_from_bottom',
            header: (props) => <StackHeader navProps={props} />,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {MODAL_SCREENS.map(({ name, titleKey }) => (
            <Stack.Screen
              key={name}
              name={name}
              options={{ title: Locales.t(titleKey), presentation: 'modal' }}
            />
          ))}
        </Stack>
      </PaperProvider>

      <StatusBar style="auto" />
    </ThemeProvider>
  )
}

export default RootLayout
