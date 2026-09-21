# Não Vale

Party game de palavras proibidas para jogar em grupo, cada pessoa no próprio celular.

Você faz seu time adivinhar a palavra da carta sem usar nenhuma das cinco proibidas. Um juiz do time adversário vê a mesma carta no celular dele e aperta **NÃO VALE** quando você escorrega.

## Como funciona uma partida

1. Alguém cria a sala e passa o código de 2 números para a mesa
2. Todo mundo entra e o dono sorteia os times
3. O dono da sala escolhe o baralho e começa
4. Cada pessoa tem 60 segundos explicando cartas para o próprio time
5. A partida acaba quando todo mundo já explicou uma vez. Ganha quem tiver mais cartas

### Pontuação

| Ação | Quem aperta | Ponto |
|---|---|---|
| Acertou | quem está explicando | time de quem explica |
| Pular | quem está explicando | ninguém, a carta volta ao baralho |
| Não vale | juiz do time adversário | time do juiz |

Qualquer jogada pode ser revertida com **Desfazer última jogada**.

## Baralhos

- **De boa** — 160 cartas sem malícia
- **Picante + extra** — 108 cartas adultas
- **Misto** — as 268 embaralhadas

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind 4 · Supabase (Postgres + Realtime) · Vitest · pnpm

## Rodar local

```bash
pnpm install
pnpm dev        # http://localhost:2000
pnpm test       # regras do jogo
pnpm icons      # gera os ícones PWA a partir do SVG
```

Precisa de um `.env.local` com:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

O SQL das tabelas está em `supabase/migrations/`. Todas usam o prefixo `nv_`.

## Por que o juiz não consegue vazar a carta

A carta em jogo fica em `nv_turn_state`, tabela com RLS ligada e sem policy: o navegador não lê essa tabela em hipótese alguma. Quem decide se você vê a carta é a rota `/api/room/state`, que só devolve para quem está explicando e para o juiz da rodada. Quem está adivinhando recebe `null`, mesmo abrindo o devtools.
