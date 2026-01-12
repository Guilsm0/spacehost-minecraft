# Guia de Instalação e Configuração - SpaceHost Minecraft

## Pré-requisitos

- Node.js 18+ 
- pnpm 10.4.1+
- Java 11+ (para WorldGeneratorApi.jar)
- MySQL 8.0+
- Git

## Instalação

### 1. Clonar o Repositório

```bash
git clone https://github.com/Guilsm0/spacehost-minecraft.git
cd spacehost-minecraft
```

### 2. Instalar Dependências

```bash
pnpm install
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/spacehost

# Manus OAuth
MANUS_OAUTH_CLIENT_ID=seu_client_id
MANUS_OAUTH_CLIENT_SECRET=seu_client_secret
MANUS_OAUTH_REDIRECT_URI=http://localhost:5173/callback

# Storage (S3)
AWS_ACCESS_KEY_ID=sua_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=spacehost-worlds

# Forge API (para upload/download de arquivos)
BUILT_IN_FORGE_API_URL=https://api.forge.example.com
BUILT_IN_FORGE_API_KEY=sua_api_key

# Server
PORT=3000
NODE_ENV=development
```

### 4. Configurar Banco de Dados

```bash
# Executar migrações
pnpm db:push

# Ou manualmente:
mysql -u user -p spacehost < drizzle/migrations.sql
```

### 5. Configurar WorldGeneratorApi.jar

1. Coloque o arquivo `WorldGeneratorApi.jar` na raiz do projeto:
```bash
cp /caminho/para/WorldGeneratorApi.jar ./
```

2. Verifique se Java está instalado:
```bash
java -version
```

### 6. Iniciar o Servidor

#### Desenvolvimento:
```bash
pnpm dev
```

#### Produção:
```bash
pnpm build
pnpm start
```

O servidor estará disponível em `http://localhost:3000`

---

## Estrutura de Diretórios

```
spacehost-minecraft/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── pages/            # Páginas
│   │   ├── lib/              # Utilitários
│   │   └── App.tsx           # App principal
│   └── package.json
├── server/                    # Backend Express + tRPC
│   ├── _core/                # Core do servidor
│   ├── routers.ts            # Rotas tRPC
│   ├── db.ts                 # Funções de banco de dados
│   ├── world-generator-api.ts    # Integração WorldGeneratorApi
│   ├── world-file-manager.ts     # Gerenciador de arquivos
│   └── index.ts              # Entry point
├── shared/                   # Código compartilhado
├── drizzle/                  # Migrações e schema
├── WorldGeneratorApi.jar     # API de geração de mundos
├── IMPROVEMENTS.md           # Documentação de melhorias
└── package.json
```

---

## Funcionalidades Principais

### 1. Autenticação
- OAuth com Manus
- Gerenciamento de sessão
- Perfil de usuário

### 2. Gerenciamento de Servidores
- Criar/editar/deletar servidores
- Listar servidores do usuário
- Controlar status (online/offline)

### 3. Gerenciamento de Mundos ⭐ NOVO
- **Gerar mundos** com WorldGeneratorApi.jar
- **Upload de mundos** (.world ou .zip)
- **Download de mundos** com compactação automática
- **Backup de mundos** com clonagem
- Validação de estrutura de mundo
- Limite de 1GB por arquivo

### 4. Gerenciamento de Jogadores
- Whitelist
- Operadores (OP)
- Banimentos
- Histórico de jogadores

### 5. Console Interativo
- Logs em tempo real
- Execução de comandos
- Filtros de log

### 6. Plugins/Mods
- Busca em CurseForge/Modrinth
- Instalação com um clique
- Gerenciamento de versões

### 7. Backups
- Backup manual
- Backup automático de mundos
- Download de backups
- Histórico de backups

---

## Usando as Novas Funcionalidades

### Gerar um Novo Mundo

1. Acesse o dashboard
2. Selecione um servidor
3. Vá para a aba "Mundos"
4. Clique em "Gerar Mundo"
5. Configure:
   - Nome do mundo
   - Tipo (Normal, Flat, Biomas Grandes, Amplificado)
   - Seed (opcional)
   - Dificuldade
   - Opções (PVP, Command Blocks, Nether)
6. Clique em "Gerar Mundo"

### Importar um Mundo

1. Vá para a aba "Mundos"
2. Clique em "Importar Mundo"
3. Selecione um arquivo `.world` ou `.zip`
4. O sistema fará backup do mundo atual automaticamente
5. O novo mundo será ativado

### Baixar um Mundo

1. Vá para a aba "Mundos"
2. Clique em "Baixar Mundo"
3. O arquivo será compactado e disponibilizado para download
4. Clique no link para baixar

### Criar Backup de um Mundo

1. Vá para a aba "Mundos"
2. Clique no ícone de cópia (📋) no mundo desejado
3. Dê um nome ao backup
4. Clique em "Criar Backup"

---

## Troubleshooting

### Erro: "WorldGeneratorApi not available"
**Solução:**
- Verifique se `WorldGeneratorApi.jar` está na raiz do projeto
- Verifique se Java está instalado: `java -version`
- O sistema usará fallback automático

### Erro: "Arquivo deve ser .world ou .zip"
**Solução:**
- Certifique-se de que o arquivo tem a extensão correta
- Renomeie o arquivo se necessário

### Erro: "Estrutura do mundo inválida"
**Solução:**
- O arquivo não contém os arquivos necessários
- Verifique se é um mundo Minecraft válido
- Tente recompactar o mundo

### Erro: "Mundo muito grande"
**Solução:**
- O arquivo excede 1GB
- Comprima o mundo ou remova dados desnecessários

### Erro de Conexão com Banco de Dados
**Solução:**
- Verifique se MySQL está rodando
- Verifique as credenciais em `.env`
- Verifique se o banco de dados existe

### Erro de Upload para S3
**Solução:**
- Verifique as credenciais AWS em `.env`
- Verifique se o bucket S3 existe
- Verifique se as permissões estão corretas

---

## Desenvolvimento

### Estrutura de Componentes

```
client/src/components/
├── server-tabs/
│   ├── WorldsTabImproved.tsx      # Gerenciamento de mundos
│   ├── BackupsTabImproved.tsx     # Gerenciamento de backups
│   ├── OverviewTab.tsx
│   ├── ConsoleTab.tsx
│   └── ...
├── ui/                            # Componentes UI (shadcn/ui)
└── ...
```

### Adicionar Nova Funcionalidade

1. **Backend (tRPC Router):**
```typescript
// server/routers.ts
worlds: router({
  newFeature: protectedProcedure
    .input(z.object({ /* ... */ }))
    .mutation(async ({ input, ctx }) => {
      // Implementação
    }),
}),
```

2. **Frontend (Component):**
```typescript
// client/src/components/MyComponent.tsx
const { data } = trpc.worlds.newFeature.useQuery();
```

### Testes

```bash
# Executar testes
pnpm test

# Testes com coverage
pnpm test:coverage
```

---

## Performance

### Otimizações Implementadas

- ✅ Cache de dados com React Query
- ✅ Lazy loading de componentes
- ✅ Compressão de mundos para download
- ✅ Validação no servidor
- ✅ Índices de banco de dados

### Recomendações

- Use CDN para servir arquivos estáticos
- Configure rate limiting para upload
- Monitore uso de armazenamento S3
- Implemente limpeza de arquivos temporários

---

## Segurança

### Medidas Implementadas

- ✅ Autenticação OAuth
- ✅ Validação de permissões
- ✅ Validação de entrada (Zod)
- ✅ Limite de tamanho de arquivo
- ✅ Sanitização de nomes de arquivo
- ✅ HTTPS recomendado em produção

### Checklist de Segurança

- [ ] Configurar HTTPS
- [ ] Habilitar CORS apenas para domínios confiáveis
- [ ] Configurar rate limiting
- [ ] Implementar logging de auditoria
- [ ] Fazer backup regular do banco de dados
- [ ] Monitorar uso de recursos

---

## Deployment

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

```bash
docker build -t spacehost-minecraft .
docker run -p 3000:3000 spacehost-minecraft
```

---

## Suporte e Documentação

- **Documentação Completa:** [IMPROVEMENTS.md](./IMPROVEMENTS.md)
- **Repositório:** https://github.com/Guilsm0/spacehost-minecraft
- **Issues:** https://github.com/Guilsm0/spacehost-minecraft/issues
- **Minecraft Wiki:** https://minecraft.wiki/

---

## Licença

MIT - Veja [LICENSE](./LICENSE) para detalhes

---

## Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## Changelog

### v1.1.0 - Gerenciamento de Mundos (Atual)
- ✅ Integração WorldGeneratorApi.jar
- ✅ Upload/Download de mundos
- ✅ Sistema de backup
- ✅ Validação de estrutura
- ✅ Interface melhorada

### v1.0.0 - Lançamento Inicial
- Autenticação OAuth
- Gerenciamento de servidores
- Console interativo
- Gerenciamento de jogadores
- Plugins/Mods

---

**Última atualização:** Janeiro 2026
