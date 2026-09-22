import React from 'react';
import { PlaceholderScreen } from './PlaceholderScreen';

export function HomeScreen() {
  return (
    <PlaceholderScreen
      title="Início"
      subtitle="Próximas reservas, alertas de pagamento e atalhos por esporte (Fase 1)."
    />
  );
}

export function MapScreen() {
  return (
    <PlaceholderScreen
      title="Mapa"
      subtitle="Pins de quadras em Porto Alegre. Sem GOOGLE_MAPS_API_KEY usa mock POA."
    />
  );
}

export function SportsScreen() {
  return (
    <PlaceholderScreen
      title="Esportes"
      subtitle="Futebol society, futevôlei, beach tennis e mais — lista + filtro na Fase 1."
    />
  );
}

export function HistoryScreen() {
  return (
    <PlaceholderScreen
      title="Histórico"
      subtitle="Reservas: aguardando parceiro, pagamento pendente, confirmada, cancelada, no-show."
    />
  );
}

export function ProfileScreen() {
  return (
    <PlaceholderScreen
      title="Perfil"
      subtitle="Dados, CPF, troca de papel usuário/parceiro e taxa de mapa (parceiro)."
    />
  );
}
