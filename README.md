# Barbearia Of The Kings — Site & Agendamento Online

Landing page de agendamento para a Barbearia Of The Kings, com tema escuro e
dourado, agendamento real com bloqueio de horário e uma área administrativa
completa para o dono editar tudo (imagens, informações, serviços, horários e
agendamentos) sem tocar em código.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- Banco de dados em arquivo JSON (`data/db.json`), com fila de escrita
  serializada para evitar conflito de horários agendados ao mesmo tempo
- Autenticação por e-mail/senha (bcrypt + JWT em cookie `httpOnly`)
- Sem serviços externos pagos: notificação de agendamento via link `wa.me`
  do WhatsApp

## Como rodar

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

Na primeira execução, o arquivo `data/db.json` é criado automaticamente com
os dados públicos da barbearia (serviços, categorias e horários iniciais).

## Área administrativa

1. Acesse `http://localhost:3000/admin` (ou o link "Área administrativa" no
   rodapé do site).
2. Na primeira vez, você será direcionado para `/admin/setup` para criar seu
   e-mail e senha de acesso — apenas quem tiver essas credenciais consegue
   entrar.
3. Nas próximas vezes, o login é feito em `/admin/login`.

No painel é possível editar:

- **Perfil & Imagens**: foto de perfil, capa, logo, bio, endereço, telefone,
  WhatsApp, Instagram e estatísticas exibidas (avaliação, seguidores etc.).
- **Serviços**: categorias, nome, descrição, preço, duração e
  ativar/desativar serviços.
- **Horários**: dias e horários de funcionamento (usados para calcular os
  horários disponíveis no agendamento).
- **Agendamentos**: lista de todos os agendamentos, com filtro por data e
  status, confirmação/conclusão/cancelamento e link direto de WhatsApp para
  o cliente.
- **Minha conta**: troca de nome, e-mail e senha.

## Como funciona o agendamento

1. O cliente escolhe um serviço, uma data e um horário disponível (calculado
   em tempo real a partir dos horários de funcionamento e dos agendamentos já
   existentes, sem exibir horários passados ou conflitantes).
2. Ao confirmar, o horário é reservado imediatamente no servidor (com
   verificação de conflito no momento da gravação, evitando que dois
   clientes reservem o mesmo horário simultaneamente).
3. O cliente recebe um botão para abrir o WhatsApp da barbearia com uma
   mensagem pré-preenchida confirmando os detalhes do agendamento.

## Build de produção

```bash
npm run build
npm run start
```

Em produção, defina a variável de ambiente `JWT_SECRET` com um valor
aleatório e secreto (veja `.env.local` para o formato).
