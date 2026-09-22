export type AccountKind = 'user' | 'partner';

export type RootStackParamList = {
  Welcome: undefined;
  CreateAccount: undefined;
  Login: undefined;
  MainTabs: { accountKind: AccountKind };
};

export type MainTabParamList = {
  Inicio: undefined;
  Mapa: undefined;
  Esportes: undefined;
  Historico: undefined;
  Perfil: undefined;
};
