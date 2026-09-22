import React from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.root}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.back}>← Voltar</Text>
      </Pressable>
      <Text style={styles.title}>Fazer login</Text>
      <Text style={styles.subtitle}>Shell de autenticação — CPF + senha (Fase 1).</Text>

      <TextInput
        style={styles.input}
        placeholder="CPF"
        placeholderTextColor={colors.muted}
        keyboardType="number-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor={colors.muted}
        secureTextEntry
      />

      <Pressable
        style={styles.btn}
        onPress={() => navigation.replace('MainTabs', { accountKind: 'user' })}
      >
        <Text style={styles.btnText}>Entrar (demo)</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand, padding: 24 },
  back: { color: colors.tealDark, fontWeight: '600', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  subtitle: { marginTop: 8, marginBottom: 24, color: colors.muted },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    color: colors.ink,
  },
  btn: {
    marginTop: 8,
    backgroundColor: colors.teal,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
