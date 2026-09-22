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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { api, Booking } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { STATUS_LABELS, RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PartnerInbox'>;

export function PartnerInboxScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setItems(await api.partnerInbox(token));
    } catch (e) {
      Alert.alert('Erro', (e as Error).message);
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

  const act = async (id: string, action: 'accept' | 'reject') => {
    if (!token) return;
    try {
      if (action === 'accept') await api.acceptBooking(token, id);
      else await api.rejectBooking(token, id);
      await load();
    } catch (e) {
      Alert.alert('Erro', (e as Error).message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.teal} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.back}>← Voltar</Text>
      </Pressable>
      <Text style={styles.title}>Inbox parceiro</Text>
      <Text style={styles.subtitle}>Aceitar / recusar holds de 15 min</Text>
      <FlatList
        data={items}
        keyExtractor={(b) => b.id}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={load} />
        }
        contentContainerStyle={{ gap: 10, paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhuma solicitação no momento.</Text>
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
              {item.user?.name ?? 'Jogador'} ·{' '}
              {new Date(item.startsAt).toLocaleString('pt-BR')}
            </Text>
            <Text style={styles.meta}>
              R$ {(item.priceCents / 100).toFixed(2)} (comissão 5%: R${' '}
              {(item.commissionCents / 100).toFixed(2)})
            </Text>
            {item.status === 'hold_15m' ? (
              <View style={styles.actions}>
                <Pressable
                  style={styles.accept}
                  onPress={() => void act(item.id, 'accept')}
                >
                  <Text style={styles.btnText}>Aceitar</Text>
                </Pressable>
                <Pressable
                  style={styles.reject}
                  onPress={() => void act(item.id, 'reject')}
                >
                  <Text style={styles.btnText}>Recusar</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand, padding: 20, paddingTop: 56 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  back: { color: colors.tealDark, fontWeight: '600', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  subtitle: { marginTop: 6, marginBottom: 16, color: colors.muted },
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
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  accept: {
    flex: 1,
    backgroundColor: colors.teal,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reject: {
    flex: 1,
    backgroundColor: '#B91C1C',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: { color: colors.white, fontWeight: '700' },
});
