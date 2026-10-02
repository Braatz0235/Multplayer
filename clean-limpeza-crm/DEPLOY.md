# Como colocar o CRM no ar

O CRM guarda os dados de duas formas:

- **PostgreSQL** — quando a variável `DATABASE_URL` (ou `POSTGRES_URL`) existe.
  É o modo usado na **Vercel**.
- **Arquivo** `/app/data/crm.json` — sem banco configurado (Docker, VPS, uso local).

> Depois do primeiro acesso, o sistema abre a tela **Configuração inicial**
> para criar o administrador. Faça isso logo após publicar.

---

## Opção 1 — Vercel + Neon Postgres (gratuito para começar)

1. Suba os arquivos para o GitHub (repositório `agendamentos`).
2. Em <https://vercel.com/new>, importe o repositório.
   - **Framework Preset:** Next.js (detectado sozinho).
   - **Root Directory:** a pasta onde está o `package.json` do CRM
     (deixe em branco se ele estiver na raiz do repositório).
   - Não precisa mudar comandos de build.
3. Clique em **Deploy**. O primeiro acesso mostra a tela
   *“Falta conectar o banco de dados”* — é esperado.
4. No projeto, abra **Storage → Create Database → Neon (Serverless Postgres)**,
   escolha a região **São Paulo (sa-east-1)** e clique em **Connect** marcando
   os ambientes *Production* e *Preview*. Isso cria a variável `DATABASE_URL`.
5. Em **Deployments**, nos três pontos do último deploy, clique em **Redeploy**.
6. Acesse o endereço `https://….vercel.app` e crie o administrador.

Recomendado:

- **Settings → Environment Variables:** crie `JWT_SECRET` com um texto
  aleatório longo (se não criar, o sistema gera um e guarda no banco).
- **Settings → Functions → Function Region:** escolha **São Paulo (gru1)**,
  a mesma região do banco, para o sistema ficar mais rápido.
- **Settings → Domains:** adicione um domínio próprio, ex. `crm.cleanlimpeza.com.br`.

A Vercel já entrega HTTPS, necessário para o GPS do check-in.

> Também funciona com Supabase ou qualquer PostgreSQL: crie a variável
> `DATABASE_URL` com a string de conexão (prefira a URL do *pooler*).

## Opção 2 — Render.com (mais simples, ~US$ 7/mês)

1. Crie uma conta em <https://render.com> e conecte seu GitHub.
2. Clique em **New + → Blueprint** e escolha o repositório `Multplayer`.
3. O Render lê o arquivo `render.yaml` da raiz e cria tudo sozinho:
   serviço Docker, disco de 1 GB em `/app/data` e a chave `JWT_SECRET`.
4. Clique em **Apply**. Em ~5 minutos o endereço `https://clean-limpeza-crm.onrender.com`
   (ou parecido) estará no ar, já com HTTPS — necessário para o GPS do check-in.
5. (Opcional) Em **Settings → Custom Domains**, aponte um domínio próprio,
   ex.: `crm.cleanlimpeza.com.br`.

> O plano gratuito do Render **não** tem disco persistente — os dados seriam
> apagados a cada reinício. Use o plano *Starter* ou superior.

## Opção 3 — Railway (~US$ 5/mês)

1. <https://railway.app> → **New Project → Deploy from GitHub repo** → `Multplayer`.
2. Em **Settings → Root Directory**, coloque `clean-limpeza-crm` (ele detecta o `Dockerfile`).
3. Em **Volumes**, adicione um volume montado em `/app/data`.
4. Em **Networking → Generate Domain** para ter o endereço HTTPS.

## Opção 4 — Servidor próprio / VPS com Docker (Hostinger, DigitalOcean, Contabo…)

```bash
git clone https://github.com/Braatz0235/Multplayer.git
cd Multplayer/clean-limpeza-crm
docker compose up -d --build
```

O CRM sobe na porta **3000** com os dados no volume `crm-data`.
Para HTTPS, coloque na frente um proxy como **Caddy** (certificado automático):

```
crm.seudominio.com.br {
    reverse_proxy localhost:3000
}
```

Atualizar para uma nova versão: `git pull && docker compose up -d --build`.

## Sem Docker (Node.js 20+)

```bash
cd clean-limpeza-crm
npm ci
npm run build
cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
CRM_DATA_DIR=/caminho/para/dados PORT=3000 node .next/standalone/server.js
```

---

## Backup

**Com Postgres (Vercel/Neon):** o Neon guarda histórico automático (point-in-time
restore). Para uma cópia manual: `pg_dump "$DATABASE_URL" > backup.sql`.

**Com arquivo:** todo o sistema está em `/app/data/crm.json`. Copie-o periodicamente. Com Docker:

```bash
docker compose cp crm:/app/data/crm.json ./backup-crm-$(date +%F).json
```

## Variáveis de ambiente

| Variável                | Padrão              | Descrição |
| ----------------------- | ------------------- | --------- |
| `DATABASE_URL`          | —                   | String de conexão PostgreSQL. **Obrigatória na Vercel.** Também aceita `POSTGRES_URL`. |
| `JWT_SECRET`            | gerada automaticamente | Chave das sessões de login. Se não definir, é criada e guardada no banco. |
| `CRM_DATA_DIR`          | `/app/data`         | Pasta do banco em arquivo (quando não há Postgres). |
| `PORT`                  | `3000`              | Porta HTTP. |
| `NEXT_PUBLIC_TIME_ZONE` | `America/Sao_Paulo` | Fuso horário da empresa (definido no build). |
