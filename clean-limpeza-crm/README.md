# Clean Limpeza — CRM de Visitas

Sistema de agendamento e acompanhamento de visitas comerciais da **Clean Limpeza**
(comércio de produtos de limpeza), no formato de CRM de atendimento.

## Funcionalidades

- **Perfis de acesso**
  - **Administrador**: acesso total, cadastra gerenciadores e funcionários e configura a empresa.
  - **Gerenciador**: agenda visitas, cadastra funcionários, acompanha funil e desempenho.
  - **Funcionário de campo**: vê só as próprias visitas, faz check-in/check-out e registra vendas.
- **Funil de atendimento (kanban)** com arrastar e soltar:
  Visitas agendadas → Em andamento → Concluídas → Venda finalizada → Pós-venda (+ Perdidas/canceladas).
  Cada etapa pede os dados certos: relatório no check-out, itens e pagamento na venda,
  satisfação/NPS e próximo contato no pós-venda, motivo na perda.
- **Google Maps integrado** (sem precisar de chave de API):
  mapa incorporado do endereço, botão **Abrir no GPS** (rota no Google Maps), **Waze**
  e **rota do dia** com todas as paradas do funcionário. CEP preenche o endereço (ViaCEP).
- **Check-in / check-out com geolocalização** do celular, para comprovar a visita,
  medir pontualidade e tempo no cliente.
- **Minha rota do dia** (tela mobile do funcionário): visitas em ordem, GPS, WhatsApp,
  ligar e iniciar a visita com um toque.
- **Painel**: visitas de hoje, em andamento, atrasadas, vendas do mês, ticket médio,
  meta da equipe, faturamento de 6 meses, funil, ranking e atividade recente.
- **Desempenho da equipe**: ranking por funcionário com visitas agendadas/realizadas,
  atrasos, vendas, conversão, faturamento, ticket médio, % da meta, pontualidade, tempo médio
  no cliente, satisfação e NPS — com filtro de período e relatório individual.
- **Clientes** (PJ/PF, segmento, origem, status lead/ativo/inativo, carteira, etiquetas),
  com histórico de visitas, total comprado e produtos mais comprados.
- **Agenda** semanal e mensal por cor de funcionário.
- **Catálogo de produtos** usado nos pedidos.
- Histórico/timeline e comentários internos em cada visita, confirmação por WhatsApp,
  impressão da visita e **exportação para Excel (CSV)**.

## Como rodar

```bash
cd clean-limpeza-crm
npm install
npm run dev        # http://localhost:3000
```

Na primeira execução você é levado a `/setup` para criar o administrador.
Marque **“Carregar dados de demonstração”** para criar um gerenciador, 3 funcionários,
clientes e visitas de exemplo (os usuários de teste usam a mesma senha que você definir):

| Perfil       | E-mail                          |
| ------------ | ------------------------------- |
| Gerenciador  | gerente@cleanlimpeza.com.br     |
| Funcionário  | rafael@cleanlimpeza.com.br      |
| Funcionário  | bianca@cleanlimpeza.com.br      |
| Funcionário  | diego@cleanlimpeza.com.br       |

## Colocar no ar

Veja o passo a passo em **[DEPLOY.md](DEPLOY.md)** (Vercel + Neon, Render, Railway, VPS com Docker).

**Vercel:** importe o repositório, conecte um banco em *Storage → Neon Postgres*
e faça *Redeploy*. Os dados ficam no Postgres (a Vercel não permite gravar em disco).
Resumo com Docker:

```bash
docker compose up -d --build   # http://localhost:3000, dados no volume crm-data
```

### Variáveis de ambiente

| Variável                | Padrão              | Descrição                                   |
| ----------------------- | ------------------- | ------------------------------------------- |
| `DATABASE_URL`          | —                   | PostgreSQL (obrigatório na Vercel). Sem ela, usa arquivo local |
| `JWT_SECRET`            | gerada automaticamente | Chave das sessões (salva no banco se não definida) |
| `CRM_DATA_DIR`          | `./data`            | Pasta do banco em arquivo (`crm.json`)      |
| `NEXT_PUBLIC_TIME_ZONE` | `America/Sao_Paulo` | Fuso horário da empresa                     |

> O check-in por GPS exige HTTPS em produção (exigência dos navegadores para geolocalização).

## Stack

Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS v4 · PostgreSQL
(com transações e bloqueio de linha) ou arquivo JSON local · login com bcrypt + JWT em
cookie `httpOnly`.
