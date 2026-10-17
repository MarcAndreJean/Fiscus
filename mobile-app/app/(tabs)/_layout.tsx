import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'
import { Appbar, Divider, Menu, Tooltip } from 'react-native-paper'

import {
  BUSINESS_MODES,
  Locales,
  TabBar,
  TabsHeader,
  useAppContext,
} from '@/lib'

const BusinessModeMenu = () => {
  const [visible, setVisible] = React.useState(false)
  const { updateAppContext } = useAppContext()

  return (
    <Menu
      statusBarHeight={48}
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <Tooltip title={Locales.t('options')}>
          <Appbar.Action icon="menu" onPress={() => setVisible(true)} />
        </Tooltip>
      }
    >
      {BUSINESS_MODES.map(({ mode, titleKey, icon, dividerBefore }) => (
        <React.Fragment key={mode}>
          {dividerBefore && <Divider />}
          <Menu.Item
            title={Locales.t(titleKey)}
            leadingIcon={icon}
            onPress={() => {
              updateAppContext({ businessMode: mode })
              setVisible(false)
            }}
          />
        </React.Fragment>
      ))}
    </Menu>
  )
}

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name']

/** A tab bar icon that switches to its filled variant when the tab is focused. */
const tabIcon = (focusedIcon: IconName, icon: IconName) =>
  function TabIcon(props: { focused: boolean; color: string; size: number }) {
    return (
      <MaterialCommunityIcons
        {...props}
        size={24}
        name={props.focused ? focusedIcon : icon}
      />
    )
  }

const TabLayout = () => {
  const { appContext } = useAppContext()
  const currentMode = BUSINESS_MODES.find(
    ({ mode }) => mode === appContext.businessMode,
  )

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        tabBarHideOnKeyboard: true,
        header: (props) => <TabsHeader navProps={props} />,
      }}
    >
      <Tabs.Screen
        name="business"
        options={{
          title: `${Locales.t('titleBusiness')} - ${Locales.t(currentMode?.titleKey ?? 'titleExpenses')}`,
          headerLeft: () => <BusinessModeMenu />,
          tabBarIcon: tabIcon('account-tie', 'account-tie-outline'),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: Locales.t('home'),
          tabBarIcon: tabIcon('home', 'home-outline'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: Locales.t('titleSettings'),
          tabBarIcon: tabIcon('cog', 'cog-outline'),
        }}
      />
    </Tabs>
  )
}

export default TabLayout
