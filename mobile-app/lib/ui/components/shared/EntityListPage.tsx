import React from 'react'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { Divider, FAB, Surface, Text, useTheme } from 'react-native-paper'

import LoadingIndicator from './LoadingIndicator'
import { errorMessage } from '../../../api/client'
import { Locales } from '../../../locales'

type Props<T> = {
  filters: React.ReactNode
  items: T[] | undefined
  isLoading: boolean
  error?: unknown
  refetch: () => Promise<unknown>
  keyOf: (item: T) => string
  renderItem: (item: T) => React.ReactNode
  /** Shows the "+" button when set. */
  onCreate?: () => void
}

/** Filters, a pull-to-refresh list and a create button: the frame of every list tab. */
function EntityListPage<T>({
  filters,
  items,
  isLoading,
  error,
  refetch,
  keyOf,
  renderItem,
  onCreate,
}: Props<T>) {
  const theme = useTheme()
  const [refreshing, setRefreshing] = React.useState(false)

  const onRefresh = React.useCallback(() => {
    setRefreshing(true)
    refetch().finally(() => setRefreshing(false))
  }, [refetch])

  return (
    <>
      <View style={styles.filters}>{filters}</View>

      {isLoading ? (
        <LoadingIndicator />
      ) : (
        <ScrollView
          style={styles.container}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]} // Android
              tintColor={theme.colors.primary} // iOS
            />
          }
        >
          {error ? (
            <Text style={[styles.message, { color: theme.colors.error }]}>
              {errorMessage(error)}
            </Text>
          ) : items?.length ? (
            <Surface style={styles.list}>
              {items.map((item, index) => (
                <React.Fragment key={keyOf(item)}>
                  {renderItem(item)}
                  {index < items.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Surface>
          ) : (
            <Text style={styles.message}>{Locales.t('emptyList')}</Text>
          )}
        </ScrollView>
      )}

      {onCreate && <FAB icon="plus" style={styles.fab} onPress={onCreate} />}
    </>
  )
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 8,
    gap: 8,
  },
  container: {
    flex: 1,
    width: '100%',
  },
  list: {
    margin: 8,
    elevation: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  message: {
    margin: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
})

export default EntityListPage
