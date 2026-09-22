import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api, Booking } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { STATUS_LABELS, RootStackParamList } from '../navigation/types';

export function HistoryScreen() {
  const { token } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setItems([]);
      setLoading(false);
      return;
    }
    setError(null);
    try {
      setItems(await api.myBookings(token));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const pay = async (id: string) => {
    if (!token) return;
    try {
      const pix = await api.createPix(token, id);
      Alert.alert(
        'Pix gerado',
        pix.pixCopyPaste ?? 'Sem copia-e-cola',
        [
          {
            text: 'Simular pagamento',
            onPress: () =>
              void api.payStub(token, id).then(() => load()),
          },
          { text: 'OK' },
        ],
      );
    } catch (e) {
      Alert.alert('Erro', (e as Error).message);
    }
  };

  if (!token) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Histórico</Text>
        <Text style={styles.subtitle}>Faça login para ver suas reservas.</Text>
        <Pressable
          style={styles.cta}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.ctaText}>Entrar</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.teal} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Histórico</Text>
      <Text style={styles.subtitle}>Status da state machine de reserva</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={items}
        keyExtractor={(b) => b.id}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={load} />
        }
        contentContainerStyle={{ gap: 10, paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhuma reserva ainda.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {item.venueName} · {item.courtName}
            </Text>
            <Text style={styles.status}>
              {STATUS_LABELS[item.status] ?? item.status}
            </Text>
            <Text style={styles.meta}>
              {new Date(item.startsAt).toLocaleString('pt-BR')}
            </Text>
            <Text style={styles.meta}>
              R$ {(item.priceCents / 100).toFixed(2)} · comissão R${' '}
              {(item.commissionCents / 100).toFixed(2)}
            </Text>
            {item.status === 'payment_pending' ? (
              <Pressable style={styles.payBtn} onPress={() => void pay(item.id)}>
                <Text style={styles.payText}>Pagar Pix</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand, padding: 20, paddingTop: 56 },
  center: {
    flex: 1,
    backgroundColor: colors.sand,
    padding: 24,
    justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  subtitle: { marginTop: 6, marginBottom: 16, color: colors.muted },
  error: { color: '#B91C1C', marginBottom: 8 },
  empty: { color: colors.muted, marginTop: 24, textAlign: 'center' },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  cardTitle: { fontWeight: '700', color: colors.navy, fontSize: 16 },
  status: { marginTop: 6, color: colors.tealDark, fontWeight: '700' },
  meta: { marginTop: 4, color: colors.muted, fontSize: 13 },
  payBtn: {
    marginTop: 12,
    backgroundColor: colors.blue,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  payText: { color: colors.white, fontWeight: '700' },
  cta: {
    marginTop: 16,
    backgroundColor: colors.teal,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: { color: colors.white, fontWeight: '700' },
});
