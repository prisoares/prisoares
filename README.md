### Hey, how's it going? 👋

Software Developer & Senior QA at Ambush · Java / Spring Boot · sports & travel.

Reach me on [LinkedIn](https://linkedin.com/in/priscilla-ferreira-soares) or [about.me](https://about.me/priscillasoares).

---

# LUDI

Marketplace **two-sided** de reserva de quadras esportivas — MVP em **Porto Alegre (pt-BR)**.

Monorepo Turborepo:

| App / package | Stack |
|---------------|--------|
| `apps/mobile` | Expo (React Native) + TypeScript |
| `apps/api` | NestJS + Prisma + PostgreSQL |
| `packages/shared` | Tipos e constantes de domínio compartilhados |

## Decisões de MVP (resumo)

- Conta dual usuário/parceiro (mesmo app Expo)
- CPF validado; pagamento **Pix only** (Asaas, stub na Fase 0)
- Hold de **15 min** aguardando parceiro
- Comissão **5%** + taxa mensal de mapa **1% do GMV**
- WhatsApp via Meta Cloud / 360dialog (stub na Fase 0)

State machine: `requested → hold_15m → accepted → payment_pending → confirmed | expired | cancelled | no_show`

## Pré-requisitos

- Node.js ≥ 20
- PostgreSQL 16 (+ Redis opcional na Fase 0)
- Docker Compose **ou** Postgres local
- npm 10+

## Subir infra local

```bash
cp .env.example .env
cp .env.example apps/api/.env

# Opção A — Docker
docker compose up -d

# Opção B — Postgres local
# createuser ludi with password ludi; create database ludi owner ludi;
```

## Instalar e migrar

```bash
npm install
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
```

Seed cria esportes (âncora: **futebol society**), venues em POA (Planetball, Arena Moinhos, Quadra Jardim Botânico) e usuários demo:

| Conta | E-mail | Senha | CPF |
|-------|--------|-------|-----|
| Parceiro | parceiro@planetball.com.br | ludi123 | 52998224725 |
| Jogador | jogador@ludi.app | ludi123 | 39053344705 |

## Rodar API

```bash
npm run dev -w @ludi/api
# http://localhost:3000/health
# http://localhost:3000/sports
# http://localhost:3000/venues
# http://localhost:3000/docs  (Swagger)
```

## Rodar app mobile

```bash
npm run dev -w @ludi/mobile
```

Abra no Expo Go ou emulador. Telas Fase 0: welcome LUDI, criar conta (usuário/parceiro), login shell, tabs (Início · Mapa · Esportes · Histórico · Perfil).

## Variáveis de ambiente

Ver [`.env.example`](.env.example). Integrações Asaas / 360dialog / Google Maps ficam em **stub** quando as keys estão vazias.

## Docs de produto

- [Product brief (Figma)](docs/figma-product-brief.md)

## Fora desta fase

- Checkout Pix completo, WhatsApp live, partner-web Next.js, chat, cancelamento/no-show operacional
