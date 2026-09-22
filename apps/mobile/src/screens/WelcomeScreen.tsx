import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { brand, colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const { height } = Dimensions.get('window');

export function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[colors.teal, colors.blue, colors.navy]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroPlane} />
      <View style={styles.content}>
        <Text style={styles.brand}>{brand.name}</Text>
        <Text style={styles.tagline}>{brand.tagline}</Text>
        <Text style={styles.city}>Porto Alegre · RS</Text>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            onPress={() => navigation.navigate('CreateAccount')}
          >
            <Text style={styles.primaryText}>Criar conta</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryText}>Fazer login</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  heroPlane: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: height * 0.12,
    height: height * 0.42,
    backgroundColor: 'rgba(255,255,255,0.08)',
    transform: [{ skewY: '-6deg' }],
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 28,
    paddingBottom: 56,
  },
  brand: {
    fontSize: 64,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 2,
  },
  tagline: {
    marginTop: 12,
    fontSize: 20,
    lineHeight: 28,
    color: colors.white,
    maxWidth: 300,
    fontWeight: '500',
  },
  city: {
    marginTop: 10,
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
  },
  actions: {
    marginTop: 36,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: colors.white,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryText: {
    color: colors.navy,
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
});
