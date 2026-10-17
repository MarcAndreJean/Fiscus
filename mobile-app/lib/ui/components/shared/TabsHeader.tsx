import { BottomTabHeaderProps } from '@react-navigation/bottom-tabs'
import { getHeaderTitle } from '@react-navigation/elements'
import React from 'react'
import { Appbar } from 'react-native-paper'

/** Header of the tab screens: optional left menu, title, optional actions. */
const TabsHeader = ({ navProps }: { navProps: BottomTabHeaderProps }) => (
  <Appbar.Header>
    {navProps.options.headerLeft?.({})}

    <Appbar.Content
      title={getHeaderTitle(navProps.options, navProps.route.name)}
    />

    {navProps.options.headerRight?.({
      canGoBack: navProps.navigation.canGoBack(),
    })}
  </Appbar.Header>
)

export default TabsHeader
