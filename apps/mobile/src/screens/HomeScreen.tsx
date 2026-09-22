import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api, Booking } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors, brand } from '../theme';
import { STATUS_LABELS, RootStackParamList } from '../navigation/types';

export function HomeScreen() {
  const { token, user } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        setUpcoming([]);
        return;
      }
      setLoading(true);
      void api
        .myBookings(token)
        .then((list) =>
          setUpcoming(
            list.filter((b) =>
              ['hold_15m', 'payment_pending', 'confirmed'].includes(b.status),
            ),
          ),
        )
        .finally(() => setLoading(false));
    }, [token]),
  );

  return (
    <View style={styles.root}>
      <Text style={styles.brand}>{brand.name}</Text>
      <Text style={styles.hello}>
        {user ? `Olá, ${user.name.split(' ')[0]}` : 'Bem-vindo'}
      </Text>
      <Text style={styles.subtitle}>
        Próximas reservas e alertas de pagamento
      </Text>

      {user?.activeRole === 'PARTNER' ? (
        <Pressable
          style={styles.inbox}
          onPress={() => navigation.navigate('PartnerInbox')}
        >
          <Text style={styles.inboxText}>Abrir inbox do parceiro</Text>
        </Pressable>
      ) : null}

      {loading ? <ActivityIndicator color={colors.teal} /> : null}

      {!token ? (
        <Text style={styles.empty}>Entre para ver suas reservas.</Text>
      ) : upcoming.length === 0 ? (
        <Text style={styles.empty}>Nenhuma reserva ativa.</Text>
      ) : (
        upcoming.slice(0, 5).map((b) => (
          <View key={b.id} style={styles.card}>
            <Text style={styles.cardTitle}>{b.venueName}</Text>
            <Text style={styles.status}>
              {STATUS_LABELS[b.status] ?? b.status}
            </Text>
            <Text style={styles.meta}>
              {new Date(b.startsAt).toLocaleString('pt-BR')}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand, padding: 20, paddingTop: 56 },
  brand: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.tealDark,
    letterSpacing: 1,
  },
  hello: { marginTop: 8, fontSize: 20, fontWeight: '700', color: colors.ink },
  subtitle: { marginTop: 4, marginBottom: 16, color: colors.muted },
  inbox: {
    backgroundColor: colors.navy,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  inboxText: { color: colors.white, fontWeight: '700' },
  empty: { color: colors.muted, marginTop: 12 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
  },
  cardTitle: { fontWeight: '700', color: colors.navy },
  status: { marginTop: 4, color: colors.tealDark, fontWeight: '600' },
  meta: { marginTop: 2, color: colors.muted, fontSize: 13 },
});
