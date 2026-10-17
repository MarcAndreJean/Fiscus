import { getHeaderTitle } from '@react-navigation/elements'
import { NativeStackHeaderProps } from '@react-navigation/native-stack'
import React from 'react'
import { Appbar } from 'react-native-paper'

/** Header of the stack (modal) screens: back button, title, optional actions. */
const StackHeader = ({ navProps }: { navProps: NativeStackHeaderProps }) => (
  <Appbar.Header>
    {navProps.options.headerLeft?.({
      canGoBack: navProps.navigation.canGoBack(),
    })}

    {navProps.back ? (
      <Appbar.BackAction onPress={navProps.navigation.goBack} />
    ) : null}

    <Appbar.Content
      title={getHeaderTitle(navProps.options, navProps.route.name)}
    />

    {navProps.options.headerRight?.({
      canGoBack: navProps.navigation.canGoBack(),
    })}
  </Appbar.Header>
)

export default StackHeader
