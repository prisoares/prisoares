import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [cpf, setCpf] = useState('39053344705');
  const [password, setPassword] = useState('ludi123');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await login(cpf, password);
      navigation.replace('MainTabs');
    } catch (e) {
      Alert.alert('Login falhou', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.back}>← Voltar</Text>
      </Pressable>
      <Text style={styles.title}>Fazer login</Text>
      <Text style={styles.subtitle}>CPF + senha (JWT)</Text>

      <TextInput
        style={styles.input}
        placeholder="CPF"
        placeholderTextColor={colors.muted}
        keyboardType="number-pad"
        value={cpf}
        onChangeText={setCpf}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor={colors.muted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable
        style={[styles.btn, busy && { opacity: 0.6 }]}
        disabled={busy}
        onPress={() => void submit()}
      >
        {busy ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.btnText}>Entrar</Text>
        )}
      </Pressable>

      <Text style={styles.hint}>
        Demo jogador: 39053344705 / ludi123{'\n'}
        Demo parceiro: 52998224725 / ludi123
      </Text>
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
  hint: { marginTop: 20, color: colors.muted, fontSize: 13, lineHeight: 20 },
});
