# 🚀 SpaceHost - Plataforma de Hospedagem de Servidores Minecraft

<div align="center">

![SpaceHost Logo](https://img.shields.io/badge/SpaceHost-Minecraft%20Hosting-blue?style=for-the-badge&logo=minecraft)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen?style=for-the-badge)

**Plataforma completa de hospedagem gratuita de servidores Minecraft com console interativo, gerenciamento de plugins/mods, backups automáticos e muito mais.**

[🌐 Acessar SpaceHost](#) • [📚 Documentação](#documentação) • [🐛 Reportar Bug](#suporte) • [💡 Sugerir Feature](#suporte)

</div>

---

## ✨ Características Principais

### 🎮 Gerenciamento de Servidores
- ✅ Criar servidores Minecraft com validação completa
- ✅ Suporte para múltiplos softwares: Vanilla, Spigot, Paper, Forge, Fabric
- ✅ Geração automática de endereço IP no formato `[nome-servidor].spacehost.cloud`
- ✅ Iniciar/parar/reiniciar servidores com um clique
- ✅ Status em tempo real (online/offline/starting/stopping)

### 🌍 Criação Automática de Mundos
- ✅ Mundo criado automaticamente ao criar servidor (sem upload necessário)
- ✅ Suporte para 4 tipos de mundo: Padrão, Plano, Biomas Grandes, Amplificado
- ✅ Configuração customizável de seed
- ✅ Estrutura Minecraft completa com todas as pastas necessárias

### 📦 Upload/Download de Mundos
- ✅ Upload de mundos (.zip, limite 1GB)
- ✅ Download do mundo atual como arquivo .zip
- ✅ Histórico de mundos enviados
- ✅ Validação automática de estrutura do mundo

### 🔧 Gerenciamento de Plugins/Mods
- ✅ Busca em CurseForge e Modrinth
- ✅ Instalação automática com um clique
- ✅ Desinstalação e atualização de addons
- ✅ Listagem de plugins/mods instalados
- ✅ Validação de compatibilidade com versão do servidor

### 🎮 Integração com Aternos
- ✅ Autenticação com credenciais Aternos
- ✅ Listar servidores do usuário
- ✅ Controle remoto de servidores (start/stop/restart)
- ✅ Execução de comandos no servidor
- ✅ Visualização de logs em tempo real
- ✅ Gerenciamento de whitelist, ops e bans
- ✅ Criação de backups automáticos

### 👥 Gerenciamento de Jogadores
- ✅ Lista de jogadores online
- ✅ Sistema de whitelist (adicionar/remover)
- ✅ Sistema de operadores/OP
- ✅ Sistema de banimentos
- ✅ Histórico de jogadores

### 🔍 Descoberta de Servidores
- ✅ Localizar servidores Minecraft externos por IP/domínio
- ✅ Verificar status do servidor remoto
- ✅ Exibir informações (MOTD, versão, jogadores, latência)

### 💾 Console e Logs
- ✅ Console interativo em tempo real
- ✅ Visualização de logs com timestamps
- ✅ Execução de comandos do Minecraft
- ✅ Histórico de comandos
- ✅ Filtros de logs (info, warning, error)

### ⚙️ Configurações Avançadas
- ✅ Configuração de slots (máximo de jogadores)
- ✅ Gamemode e force gamemode
- ✅ Dificuldade do servidor
- ✅ Toggle de PVP, whitelist, cracked
- ✅ Spawn protection, command blocks, Nether
- ✅ Spawn de animais e monstros

### 📊 Painel de Controle
- ✅ Dashboard com visão geral dos servidores
- ✅ Abas: Overview, Console, Players, Files, Backups, Worlds, Addons, Events, Options
- ✅ Estatísticas de uptime, RAM, armazenamento
- ✅ Log de eventos do servidor

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 19** - Interface de usuário moderna
- **TypeScript** - Tipagem estática
- **Tailwind CSS 4** - Estilização responsiva
- **shadcn/ui** - Componentes de alta qualidade
- **Wouter** - Roteamento leve
- **Sonner** - Notificações elegantes

### Backend
- **Express 4** - Servidor web
- **tRPC 11** - RPC type-safe
- **Drizzle ORM** - Gerenciamento de banco de dados
- **MySQL/TiDB** - Banco de dados
- **Zod** - Validação de schemas

### Integrações
- **Aternos API** - Gerenciamento de servidores Minecraft
- **CurseForge API** - Busca de plugins/mods
- **Modrinth API** - Repositório de mods
- **S3 Storage** - Armazenamento em nuvem
- **OAuth 2.0** - Autenticação segura

---

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 22+
- pnpm 10+
- Banco de dados MySQL/TiDB
- Conta Aternos (opcional, para integração)

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/Guilsm0/spacehost-minecraft.git
cd spacehost-minecraft
```

2. **Instale as dependências**
```bash
pnpm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite .env com suas configurações
```

4. **Configure o banco de dados**
```bash
pnpm db:push
```

5. **Inicie o servidor de desenvolvimento**
```bash
pnpm dev
```

6. **Acesse a aplicação**
```
http://localhost:3000
```

---

## 📚 Documentação

### Estrutura do Projeto

```
spacehost-minecraft/
├── client/                          # Frontend React
│   ├── src/
│   │   ├── pages/                   # Páginas da aplicação
│   │   │   ├── Home.tsx             # Landing page
│   │   │   ├── Dashboard.tsx        # Dashboard de servidores
│   │   │   └── ServerManagement.tsx # Painel de gerenciamento
│   │   ├── components/              # Componentes reutilizáveis
│   │   │   ├── CreateServerModal.tsx
│   │   │   ├── ServerDiscovery.tsx
│   │   │   ├── AternosIntegration.tsx
│   │   │   ├── AddonInstaller.tsx
│   │   │   └── server-tabs/         # Abas do gerenciador
│   │   ├── lib/trpc.ts              # Cliente tRPC
│   │   └── index.css                # Estilos globais
│   └── public/                      # Arquivos estáticos
├── server/                          # Backend Express + tRPC
│   ├── routers.ts                   # Endpoints da API
│   ├── db.ts                        # Funções de banco de dados
│   ├── aternos-integration.ts       # Cliente Aternos
│   ├── world-auto-create.ts         # Criação automática de mundos
│   ├── world-manager.ts             # Gerenciamento de mundos
│   ├── addon-installer.ts           # Instalação de plugins/mods
│   ├── minecraft-discovery.ts       # Descoberta de servidores
│   └── _core/                       # Configuração interna
├── drizzle/                         # Migrações de banco de dados
│   └── schema.ts                    # Schema das tabelas
├── storage/                         # Helpers de armazenamento S3
├── shared/                          # Código compartilhado
├── package.json                     # Dependências
└── tsconfig.json                    # Configuração TypeScript
```

### Variáveis de Ambiente

```env
# Banco de dados
DATABASE_URL=mysql://user:password@host:3306/spacehost

# Autenticação
JWT_SECRET=sua_chave_secreta_aqui
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# APIs Internas
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=sua_chave_api

# Aternos (opcional)
ATERNOS_USERNAME=seu_usuario_aternos
ATERNOS_PASSWORD=sua_senha_aternos

# CurseForge (opcional)
CURSEFORGE_API_KEY=sua_chave_curseforge
```

---

## 📖 Guias de Uso

### Criar um Servidor
1. Clique em "Novo Servidor" no dashboard
2. Preencha os dados: nome, versão, software, slots, dificuldade
3. Escolha o tipo de mundo (Padrão, Plano, etc)
4. Configure o seed (opcional)
5. Clique em "Criar Servidor"
6. O mundo será criado automaticamente!

### Gerenciar Servidor
1. Clique no servidor no dashboard
2. Use as abas para gerenciar:
   - **Overview**: Status e informações gerais
   - **Console**: Visualizar logs e executar comandos
   - **Players**: Gerenciar whitelist, ops, bans
   - **Files**: Navegar pelos arquivos do servidor
   - **Backups**: Criar e restaurar backups
   - **Worlds**: Upload/download de mundos
   - **Addons**: Instalar plugins/mods
   - **Events**: Histórico de eventos
   - **Options**: Configurações avançadas

### Integrar com Aternos
1. Vá para "Integração Aternos"
2. Faça login com suas credenciais Aternos
3. Seus servidores Aternos aparecerão na lista
4. Controle-os diretamente do SpaceHost!

---

## 🧪 Testes

Executar todos os testes:
```bash
pnpm test
```

---

## 🏗️ Build para Produção

```bash
# Build
pnpm build

# Iniciar servidor de produção
pnpm start
```

---

## 🔐 Segurança

- ✅ Autenticação OAuth 2.0
- ✅ Validação de entrada com Zod
- ✅ Proteção contra CSRF
- ✅ Senhas criptografadas
- ✅ Tokens JWT seguros
- ✅ Rate limiting
- ✅ HTTPS obrigatório em produção

---

## 📊 Arquitetura

### Fluxo de Dados
```
Cliente (React)
    ↓
tRPC Client
    ↓
Express Server
    ↓
tRPC Routers
    ↓
Database (MySQL/TiDB)
    ↓
Aternos API / S3 Storage
```

---

## 🚀 Deploy

### Manus Hosting (Recomendado)
1. Clique em "Publish" no painel Manus
2. Escolha um domínio customizado (opcional)
3. Seu site estará online em segundos!

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 🐛 Suporte

Encontrou um bug? Tem uma sugestão? Abra uma [issue](https://github.com/Guilsm0/spacehost-minecraft/issues)!

---

## 🙏 Agradecimentos

- [Aternos](https://aternos.org) - Inspiração e API
- [CurseForge](https://www.curseforge.com) - Repositório de mods
- [Modrinth](https://modrinth.com) - Repositório de mods
- [shadcn/ui](https://ui.shadcn.com) - Componentes UI
- [Tailwind CSS](https://tailwindcss.com) - Framework CSS

---

## 📞 Contato

- GitHub: [@Guilsm0](https://github.com/Guilsm0)
- Issues: [Abrir issue](https://github.com/Guilsm0/spacehost-minecraft/issues)

---

<div align="center">

**Feito com ❤️ para a comunidade Minecraft**

⭐ Se você gostou do projeto, deixe uma estrela! ⭐

</div>
