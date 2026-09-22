import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api, Venue } from '../api/client';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

/** Basic list-on-map with lat/lng markers (mock coords from seed when no Google key). */
export function MapScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setVenues(await api.venues());
    } catch {
      setVenues([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.teal} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Mapa</Text>
      <Text style={styles.subtitle}>
        Pins POA (lat/lng) · Google Maps quando houver API key
      </Text>
      <View style={styles.mapPlane}>
        <Text style={styles.mapHint}>Porto Alegre · centro -30.03, -51.22</Text>
        {venues.map((v) => (
          <View key={v.id} style={styles.pin}>
            <Text style={styles.pinDot}>●</Text>
            <Text style={styles.pinLabel}>
              {v.name} ({v.lat.toFixed(3)}, {v.lng.toFixed(3)})
            </Text>
          </View>
        ))}
      </View>
      <FlatList
        data={venues}
        keyExtractor={(v) => v.id}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={load} />
        }
        contentContainerStyle={{ gap: 8, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() =>
              navigation.navigate('VenueDetail', { slug: item.slug })
            }
          >
            <Text style={styles.rowTitle}>{item.name}</Text>
            <Text style={styles.rowMeta}>{item.neighborhood}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand, padding: 20, paddingTop: 56 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  subtitle: { marginTop: 6, marginBottom: 12, color: colors.muted },
  mapPlane: {
    backgroundColor: '#CCFBF1',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    minHeight: 160,
  },
  mapHint: { color: colors.navy, fontWeight: '600', marginBottom: 8 },
  pin: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  pinDot: { color: '#B91C1C', fontSize: 12 },
  pinLabel: { color: colors.ink, fontSize: 12 },
  row: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  rowTitle: { fontWeight: '700', color: colors.navy },
  rowMeta: { marginTop: 2, color: colors.muted, fontSize: 13 },
});
