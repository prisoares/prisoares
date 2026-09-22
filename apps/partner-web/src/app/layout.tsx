import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LUDI Parceiro',
  description: 'Painel do parceiro — locais, quadras, agenda e taxa de mapa',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
