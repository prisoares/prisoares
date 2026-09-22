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
import { api, Sport, Venue } from '../api/client';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

export function SportsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [sports, setSports] = useState<Sport[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSports = useCallback(async () => {
    setError(null);
    try {
      const data = await api.sports();
      setSports(data);
      if (!selected && data[0]) {
        setSelected(data[0].slug);
        setVenues(await api.venues(data[0].slug));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  const pickSport = async (slug: string) => {
    setSelected(slug);
    try {
      setVenues(await api.venues(slug));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadSports();
    }, [loadSports]),
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
      <Text style={styles.title}>Esportes</Text>
      <Text style={styles.subtitle}>Lista da API · Porto Alegre</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        horizontal
        data={sports}
        keyExtractor={(s) => s.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.chip,
              selected === item.slug && styles.chipActive,
            ]}
            onPress={() => void pickSport(item.slug)}
          >
            <Text
              style={[
                styles.chipText,
                selected === item.slug && styles.chipTextActive,
              ]}
            >
              {item.name}
            </Text>
          </Pressable>
        )}
      />

      <FlatList
        data={venues}
        keyExtractor={(v) => v.id}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => selected && void pickSport(selected)}
          />
        }
        contentContainerStyle={{ gap: 10, paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum local para este esporte.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate('VenueDetail', { slug: item.slug })
            }
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardMeta}>
              {item.neighborhood} · a partir de R${' '}
              {(item.minPriceCents / 100).toFixed(0)}
            </Text>
            <Text style={styles.cardAddr}>{item.address}</Text>
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
  subtitle: { marginTop: 6, marginBottom: 16, color: colors.muted },
  error: { color: '#B91C1C', marginBottom: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  chipText: { color: colors.navy, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: colors.white },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.navy },
  cardMeta: { marginTop: 4, color: colors.tealDark, fontWeight: '600' },
  cardAddr: { marginTop: 4, color: colors.muted, fontSize: 13 },
  empty: { color: colors.muted, marginTop: 24, textAlign: 'center' },
});
