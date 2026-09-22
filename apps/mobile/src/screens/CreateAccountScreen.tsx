import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  SafeAreaView,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateAccount'>;

export function CreateAccountScreen({ navigation }: Props) {
  const [modalVisible, setModalVisible] = useState(true);

  const choose = (role: 'USER' | 'PARTNER') => {
    setModalVisible(false);
    navigation.navigate('RegisterForm', { role });
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
            <Pressable style={styles.option} onPress={() => choose('PARTNER')}>
              <Text style={styles.optionTitle}>Conta PARCEIRO</Text>
              <Text style={styles.optionHint}>
                Cadastre seu local e gerencie reservas
              </Text>
            </Pressable>
            <Pressable style={styles.option} onPress={() => choose('USER')}>
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
        <Pressable style={styles.option} onPress={() => choose('USER')}>
          <Text style={styles.optionTitle}>Conta USUÁRIO</Text>
        </Pressable>
        <Pressable style={styles.option} onPress={() => choose('PARTNER')}>
          <Text style={styles.optionTitle}>Conta PARCEIRO</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

type FormProps = NativeStackScreenProps<RootStackParamList, 'RegisterForm'>;

export function RegisterFormScreen({ navigation, route }: FormProps) {
  const { register } = useAuth();
  const role = route.params.role;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await register({ name, email, cpf, password, phone, role });
      navigation.replace('MainTabs');
    } catch (e) {
      Alert.alert('Cadastro falhou', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Voltar</Text>
        </Pressable>
        <Text style={styles.title}>
          Cadastro {role === 'PARTNER' ? 'parceiro' : 'usuário'}
        </Text>
        <Text style={styles.subtitle}>CPF validado (algoritmo + bureau stub)</Text>
        {(
          [
            ['Nome', name, setName, 'default'],
            ['E-mail', email, setEmail, 'email-address'],
            ['CPF', cpf, setCpf, 'number-pad'],
            ['Telefone', phone, setPhone, 'phone-pad'],
            ['Senha', password, setPassword, 'default'],
          ] as const
        ).map(([label, value, setter, keyboard]) => (
          <TextInput
            key={label}
            style={styles.input}
            placeholder={label}
            placeholderTextColor={colors.muted}
            value={value}
            onChangeText={setter}
            keyboardType={keyboard}
            secureTextEntry={label === 'Senha'}
            autoCapitalize={label === 'E-mail' ? 'none' : 'sentences'}
          />
        ))}
        <Pressable
          style={[styles.btn, busy && { opacity: 0.6 }]}
          disabled={busy}
          onPress={() => void submit()}
        >
          {busy ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.btnText}>Criar conta</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand },
  header: { padding: 24, gap: 8 },
  back: { color: colors.tealDark, fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: 15, color: colors.muted, lineHeight: 22, marginBottom: 12 },
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
