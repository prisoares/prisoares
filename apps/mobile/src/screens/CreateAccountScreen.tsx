import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../theme';
import type { RootStackParamList, AccountKind } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateAccount'>;

export function CreateAccountScreen({ navigation }: Props) {
  const [modalVisible, setModalVisible] = useState(true);

  const choose = (kind: AccountKind) => {
    setModalVisible(false);
    navigation.replace('MainTabs', { accountKind: kind });
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Voltar</Text>
        </Pressable>
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>
          Escolha como você quer usar o LUDI. A mesma conta pode ser usuário e
          parceiro depois.
        </Text>
      </View>

      <Modal transparent visible={modalVisible} animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Criar conta</Text>
            <Pressable
              style={styles.option}
              onPress={() => choose('partner')}
            >
              <Text style={styles.optionTitle}>Conta PARCEIRO</Text>
              <Text style={styles.optionHint}>
                Cadastre seu local e gerencie reservas
              </Text>
            </Pressable>
            <Pressable style={styles.option} onPress={() => choose('user')}>
              <Text style={styles.optionTitle}>Conta USUÁRIO</Text>
              <Text style={styles.optionHint}>
                Encontre quadras e reserve horários
              </Text>
            </Pressable>
            <Pressable onPress={() => setModalVisible(false)}>
              <Text style={styles.cancel}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={styles.manual}>
        <Pressable style={styles.option} onPress={() => choose('user')}>
          <Text style={styles.optionTitle}>Conta USUÁRIO</Text>
        </Pressable>
        <Pressable style={styles.option} onPress={() => choose('partner')}>
          <Text style={styles.optionTitle}>Conta PARCEIRO</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand },
  header: { padding: 24, gap: 8 },
  back: { color: colors.tealDark, fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: 15, color: colors.muted, lineHeight: 22 },
  manual: { paddingHorizontal: 24, gap: 12 },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4,
  },
  option: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 18,
  },
  optionTitle: { fontSize: 16, fontWeight: '700', color: colors.navy },
  optionHint: { marginTop: 4, color: colors.muted, fontSize: 13 },
  cancel: {
    textAlign: 'center',
    marginTop: 8,
    color: colors.muted,
    fontWeight: '600',
  },
});
