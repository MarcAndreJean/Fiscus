import React from 'react'
import { Platform, ScrollView, StyleSheet, useColorScheme } from 'react-native'
import {
  Button,
  Checkbox,
  HelperText,
  Icon,
  IconButton,
  List,
  Menu,
  Snackbar,
  Surface,
} from 'react-native-paper'

import {
  Color,
  Colors,
  EditTextSettingDialog,
  LoadingIndicator,
  Locales,
  maskSecret,
  Setting,
  useSettings,
} from '@/lib'
import { normalizeApiUrl, parseList } from '@/lib/settings/settingsStorage'

type TextFieldKey =
  | 'apiUrl'
  | 'apiKey'
  | 'userId'
  | 'businessIds'
  | 'carIds'
  | 'houseIds'

const trimText = (value: string) => value.trim()

const TEXT_FIELDS: {
  key: TextFieldKey
  icon: string
  secret?: boolean
  /** Turns the typed text into the stored value. */
  parse: (value: string) => string | string[]
}[] = [
  { key: 'apiUrl', icon: 'web', parse: normalizeApiUrl },
  { key: 'apiKey', icon: 'key-variant', secret: true, parse: trimText },
  { key: 'userId', icon: 'account-tie', parse: trimText },
  { key: 'businessIds', icon: 'domain', parse: parseList },
  { key: 'carIds', icon: 'car', parse: parseList },
  { key: 'houseIds', icon: 'home', parse: parseList },
]

const TAX_DEFAULTS = [
  { key: 'hasTps', labelKey: 'defaultHasTps' },
  { key: 'hasTvq', labelKey: 'defaultHasTvq' },
] as const

const THEMES: { value: Setting['theme']; labelKey: string; icon: string }[] = [
  { value: 'auto', labelKey: 'system', icon: 'theme-light-dark' },
  { value: 'light', labelKey: 'lightMode', icon: 'weather-sunny' },
  { value: 'dark', labelKey: 'darkMode', icon: 'weather-night' },
]

const textValue = (settings: Setting, key: TextFieldKey): string => {
  const value = settings[key]
  return Array.isArray(value) ? value.join(', ') : value
}

const Settings = () => {
  const colorScheme = useColorScheme()
  const { settings, isLoading, saveSettings } = useSettings()
  const [draft, setDraft] = React.useState(settings)
  const [editing, setEditing] = React.useState<TextFieldKey | null>(null)
  const [menu, setMenu] = React.useState<'theme' | 'color' | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)

  React.useEffect(() => setDraft(settings), [settings])

  const themeColors =
    Colors[draft.theme === 'auto' ? (colorScheme ?? 'light') : draft.theme]
  const editingField = TEXT_FIELDS.find(({ key }) => key === editing)
  const isDirty = JSON.stringify(draft) !== JSON.stringify(settings)

  const save = async () => {
    try {
      await saveSettings(draft)
      setMessage(
        Locales.t(
          Platform.OS === 'web' ? 'settingsSavedForSession' : 'settingsSaved',
        ),
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
    }
  }

  if (isLoading) {
    return <LoadingIndicator />
  }

  return (
    <>
      <ScrollView>
        <Surface style={styles.screen}>
          <List.AccordionGroup>
            <List.Accordion
              id="appearance"
              title={Locales.t('appearance')}
              left={(props) => <List.Icon {...props} icon="palette" />}
            >
              <List.Item
                title={Locales.t('mode')}
                description={Locales.t('changeMode')}
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon={
                      THEMES.find(({ value }) => value === draft.theme)?.icon ??
                      'theme-light-dark'
                    }
                  />
                )}
                right={(props) => (
                  <Menu
                    visible={menu === 'theme'}
                    onDismiss={() => setMenu(null)}
                    anchor={
                      <IconButton
                        {...props}
                        icon="pencil"
                        onPress={() => setMenu('theme')}
                      />
                    }
                  >
                    {THEMES.map(({ value, labelKey, icon }) => (
                      <Menu.Item
                        key={value}
                        title={Locales.t(labelKey)}
                        leadingIcon={icon}
                        trailingIcon={
                          draft.theme === value ? 'check' : undefined
                        }
                        onPress={() => {
                          setDraft({ ...draft, theme: value })
                          setMenu(null)
                        }}
                      />
                    ))}
                  </Menu>
                )}
              />
              <List.Item
                title={Locales.t('color')}
                description={Locales.t('changeColor')}
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon="palette-swatch-variant"
                    color={themeColors[draft.color]?.primary}
                  />
                )}
                right={(props) => (
                  <Menu
                    visible={menu === 'color'}
                    onDismiss={() => setMenu(null)}
                    anchor={
                      <IconButton
                        {...props}
                        icon="pencil"
                        onPress={() => setMenu('color')}
                      />
                    }
                  >
                    {(Object.keys(Colors.light) as Color[]).map((color) => (
                      <Surface
                        key={color}
                        elevation={0}
                        style={styles.colorRow}
                      >
                        <Surface
                          elevation={0}
                          style={[
                            styles.colorSwatch,
                            color === draft.color && {
                              backgroundColor: themeColors[color].primary,
                            },
                          ]}
                        >
                          <Icon
                            size={24}
                            source="palette"
                            color={
                              color === draft.color
                                ? themeColors[color].onPrimary
                                : themeColors[color].primary
                            }
                          />
                        </Surface>
                        <Menu.Item
                          title={Locales.t(color)}
                          onPress={() => {
                            setDraft({ ...draft, color })
                            setMenu(null)
                          }}
                        />
                      </Surface>
                    ))}
                  </Menu>
                )}
              />
            </List.Accordion>

            <List.Accordion
              id="api"
              title={Locales.t('apiSettings')}
              left={(props) => <List.Icon {...props} icon="api" />}
            >
              {TEXT_FIELDS.map(({ key, icon, secret }) => (
                <List.Item
                  key={key}
                  title={Locales.t(key)}
                  description={
                    secret
                      ? maskSecret(draft[key] as string)
                      : textValue(draft, key)
                  }
                  left={(props) => <List.Icon {...props} icon={icon} />}
                  right={(props) => (
                    <IconButton
                      {...props}
                      icon="pencil"
                      onPress={() => setEditing(key)}
                    />
                  )}
                />
              ))}
              {TAX_DEFAULTS.map(({ key, labelKey }) => (
                <List.Item
                  key={key}
                  title={Locales.t(labelKey)}
                  left={(props) => <List.Icon {...props} icon="percent" />}
                  right={() => (
                    <Checkbox
                      status={draft[key] ? 'checked' : 'unchecked'}
                      onPress={() => setDraft({ ...draft, [key]: !draft[key] })}
                    />
                  )}
                />
              ))}
            </List.Accordion>
          </List.AccordionGroup>

          {isDirty && (
            <HelperText type="info" visible style={styles.unsaved}>
              {Locales.t('unsavedChanges')}
            </HelperText>
          )}
          <Button mode="contained" style={styles.saveButton} onPress={save}>
            {Locales.t('save')}
          </Button>
        </Surface>
      </ScrollView>

      {editingField && (
        <EditTextSettingDialog
          visible
          label={Locales.t(editingField.key)}
          value={textValue(draft, editingField.key)}
          onDismiss={() => setEditing(null)}
          onSubmit={(value) => {
            setDraft({
              ...draft,
              [editingField.key]: editingField.parse(value),
            })
            setEditing(null)
          }}
        />
      )}

      <Snackbar
        visible={message !== null}
        onDismiss={() => setMessage(null)}
        onIconPress={() => setMessage(null)}
      >
        {message}
      </Snackbar>
    </>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  colorRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorSwatch: {
    padding: 4,
    marginLeft: 8,
    borderRadius: 16,
  },
  unsaved: {
    marginHorizontal: 16,
  },
  saveButton: {
    margin: 16,
  },
})

export default Settings
