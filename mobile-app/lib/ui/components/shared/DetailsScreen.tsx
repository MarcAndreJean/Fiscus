import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { Platform } from 'react-native'
import { Surface } from 'react-native-paper'

import EntityNotFound from './EntityNotFound'
import { styles } from '../../styles'

/** Frame of a details modal: shows the entry, or a "not found" message. */
const DetailsScreen = ({
  found,
  children,
}: {
  found: boolean
  children: React.ReactNode
}) => (
  <Surface style={styles.screen}>
    <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    {found ? children : <EntityNotFound />}
  </Surface>
)

export default DetailsScreen
