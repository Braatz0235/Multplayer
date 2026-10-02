# Como colocar o CRM no ar

O CRM precisa de um servidor Node.js **com disco persistente** (o banco fica em
`/app/data/crm.json`). Abaixo, três caminhos — do mais simples ao mais barato.

> Depois do primeiro acesso, o sistema abre a tela **Configuração inicial**
> para criar o administrador. Faça isso logo após publicar.

---

## Opção 1 — Render.com (mais simples, ~US$ 7/mês)

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

## Opção 2 — Railway (~US$ 5/mês)

1. <https://railway.app> → **New Project → Deploy from GitHub repo** → `Multplayer`.
2. Em **Settings → Root Directory**, coloque `clean-limpeza-crm` (ele detecta o `Dockerfile`).
3. Em **Volumes**, adicione um volume montado em `/app/data`.
4. Em **Networking → Generate Domain** para ter o endereço HTTPS.

## Opção 3 — Servidor próprio / VPS com Docker (Hostinger, DigitalOcean, Contabo…)

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

Todo o sistema (usuários, clientes, visitas, vendas) está em um único arquivo:
`/app/data/crm.json`. Copie-o periodicamente. Com Docker:

```bash
docker compose cp crm:/app/data/crm.json ./backup-crm-$(date +%F).json
```

## Variáveis de ambiente

| Variável                | Padrão              | Descrição |
| ----------------------- | ------------------- | --------- |
| `JWT_SECRET`            | gerada automaticamente | Chave das sessões de login. Se não definir, é criada e guardada em `/app/data/.session-secret`. |
| `CRM_DATA_DIR`          | `/app/data`         | Pasta do banco de dados. |
| `PORT`                  | `3000`              | Porta HTTP. |
| `NEXT_PUBLIC_TIME_ZONE` | `America/Sao_Paulo` | Fuso horário da empresa (definido no build). |
