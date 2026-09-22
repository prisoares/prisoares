import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { api, Venue } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'VenueDetail'>;

function nextEveningSlot(): { startsAt: string; endsAt: string } {
  const start = new Date();
  start.setDate(start.getDate() + 2);
  start.setHours(19, 0, 0, 0);
  const end = new Date(start);
  end.setHours(20, 0, 0, 0);
  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}

export function VenueDetailScreen({ navigation, route }: Props) {
  const { token } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [courtId, setCourtId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slot = useMemo(() => nextEveningSlot(), []);

  useFocusEffect(
    useCallback(() => {
      void api
        .venue(route.params.slug)
        .then((v) => {
          setVenue(v);
          setCourtId(v.courts[0]?.id ?? null);
        })
        .catch((e) => setError((e as Error).message));
    }, [route.params.slug]),
  );

  const requestBooking = async () => {
    if (!token) {
      Alert.alert('Login necessário', 'Entre para solicitar uma reserva.');
      navigation.navigate('Login');
      return;
    }
    if (!courtId) return;
    setBusy(true);
    setError(null);
    try {
      const booking = await api.createBooking(token, {
        courtId,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
      });
      Alert.alert(
        'Pedido enviado',
        `Hold de 15 min. Status: ${booking.status}`,
        [
          {
            text: 'Ver histórico',
            onPress: () => navigation.navigate('MainTabs'),
          },
        ],
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!venue) {
    return (
      <View style={styles.center}>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <ActivityIndicator color={colors.teal} />
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 40 }}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.back}>← Voltar</Text>
      </Pressable>
      <Text style={styles.title}>{venue.name}</Text>
      <Text style={styles.meta}>
        {venue.neighborhood} · {venue.city}
      </Text>
      <Text style={styles.addr}>{venue.address}</Text>
      {venue.description ? (
        <Text style={styles.desc}>{venue.description}</Text>
      ) : null}

      <Text style={styles.section}>Quadras</Text>
      {venue.courts.map((c) => (
        <Pressable
          key={c.id}
          style={[styles.court, courtId === c.id && styles.courtActive]}
          onPress={() => setCourtId(c.id)}
        >
          <Text style={styles.courtName}>
            {c.name} · {c.sportName}
          </Text>
          <Text style={styles.price}>
            R$ {(c.priceCents / 100).toFixed(0)}
          </Text>
        </Pressable>
      ))}

      <Text style={styles.section}>Horário sugerido</Text>
      <Text style={styles.slot}>
        {new Date(slot.startsAt).toLocaleString('pt-BR')} –{' '}
        {new Date(slot.endsAt).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.cta, busy && { opacity: 0.6 }]}
        disabled={busy}
        onPress={() => void requestBooking()}
      >
        <Text style={styles.ctaText}>
          {busy ? 'Enviando…' : 'Solicitar reserva'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand, padding: 20, paddingTop: 56 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  back: { color: colors.tealDark, fontWeight: '600', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  meta: { marginTop: 6, color: colors.tealDark, fontWeight: '600' },
  addr: { marginTop: 4, color: colors.muted },
  desc: { marginTop: 12, color: colors.ink, lineHeight: 22 },
  section: {
    marginTop: 24,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },
  court: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  courtActive: { borderColor: colors.teal, backgroundColor: '#F0FDFA' },
  courtName: { fontWeight: '600', color: colors.ink },
  price: { fontWeight: '700', color: colors.tealDark },
  slot: { color: colors.ink, fontWeight: '600' },
  cta: {
    marginTop: 24,
    backgroundColor: colors.teal,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  error: { color: '#B91C1C', marginTop: 12 },
});
