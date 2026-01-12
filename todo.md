# SpaceHost - Plataforma de Hospedagem de Servidores Minecraft

## Funcionalidades Principais

### Autenticação e Usuários
- [x] Sistema de autenticação com Manus OAuth
- [x] Perfil de usuário com informações e configurações
- [x] Gerenciamento de sessão e logout

### Criação e Gerenciamento de Servidores
- [x] Formulário de criação de servidor com validação completa
- [x] Campos: nome, versão Minecraft, software (Vanilla/Spigot/Paper/Forge/Fabric), slots, dificuldade, gamemode, tipo de mundo
- [x] Geração automática de endereço IP no formato [nome-servidor].spacehost.cloud
- [x] Geração automática de porta (sem campo manual)
- [x] Limite de servidores por usuário
- [x] Listagem de servidores do usuário com status (online/offline)
- [x] Edição de configurações do servidor
- [x] Exclusão de servidor com confirmação

### Painel de Gerenciamento - Overview
- [x] Exibir status do servidor (online/offline)
- [x] Botões de iniciar/parar/reiniciar servidor
- [x] Informações de conexão: endereço IP e porta
- [x] Estatísticas: uptime, RAM usada/total, armazenamento usado/total
- [x] Contagem de jogadores online/máximo
- [x] Software e versão do servidor

### Painel de Gerenciamento - Console
- [x] Console interativo em tempo real
- [x] Exibir logs do servidor com timestamps
- [x] Campo de entrada para executar comandos do Minecraft
- [x] Histórico de comandos executados
- [x] Auto-scroll dos logs
- [x] Filtros de logs (info, warning, error)

### Painel de Gerenciamento - Players
- [x] Lista de jogadores online com status
- [x] Sistema de whitelist (adicionar/remover jogadores)
- [x] Sistema de operadores/OP (adicionar/remover)
- [x] Sistema de banimentos (ban/unban por nome ou IP)
- [x] Histórico de jogadores que já entraram
- [ ] Permissões e roles customizadas

### Painel de Gerenciamento - Files
- [x] Navegador de arquivos do servidor
- [ ] Upload de arquivos (plugins, mods, configs)
- [ ] Download de arquivos
- [ ] Editor de arquivos de configuração (.properties, .yml, .json)
- [ ] Criação de pastas
- [ ] Exclusão de arquivos/pastas com confirmação

### Painel de Gerenciamento - Backups
- [ ] Sistema de backup automático agendado
- [x] Backup manual sob demanda
- [x] Lista de backups com data/hora e tamanho
- [ ] Restauração de backup com confirmação
- [ ] Download de backup
- [ ] Exclusão de backups antigos
- [x] Armazenamento seguro em S3

### Painel de Gerenciamento - Worlds
- [x] Lista de mundos disponíveis no servidor
- [ ] Upload de mundo (pasta ou .zip, limite 1GB)
- [ ] Download de mundo atual como .zip
- [ ] Seleção de mundo ativo
- [ ] Exclusão de mundos não utilizados
- [ ] Validação de estrutura do mundo (level.dat)

### Painel de Gerenciamento - Software
- [x] Busca de plugins (Spigot/Paper) via API CurseForge/Modrinth
- [x] Busca de mods (Forge/Fabric) via API CurseForge/Modrinth
- [ ] Instalação de plugins/mods com um clique
- [x] Lista de plugins/mods instalados
- [ ] Atualização de plugins/mods
- [ ] Remoção de plugins/mods
- [ ] Filtros por categoria e versão do Minecraft

### Painel de Gerenciamento - Access
- [ ] Compartilhar acesso ao servidor com outros usuários
- [ ] Níveis de permissão (admin, editor, viewer)
- [ ] Lista de usuários com acesso
- [ ] Revogar acesso

### Painel de Gerenciamento - Events
- [x] Log de eventos do servidor (start, stop, crash)
- [x] Log de jogadores (join, leave, kick, ban)
- [x] Log de alterações de configuração
- [x] Filtros por tipo de evento e data

### Painel de Gerenciamento - Options
- [x] Configuração de slots (jogadores máximos)
- [x] Configuração de gamemode e force gamemode
- [x] Configuração de dificuldade
- [x] Toggle de whitelist
- [x] Toggle de cracked (contas não-premium)
- [x] Toggle de PVP
- [x] Toggle de spawn de animais e monstros
- [x] Toggle de command blocks
- [x] Toggle de Nether
- [x] Configuração de spawn protection (raio em blocos)
- [x] Outras configurações do server.properties

### Integração com API Aternos
- [x] Integrar biblioteca aternos-api do GitHub
- [x] Remover sistema de fila do Aternos
- [x] Iniciar servidor via API
- [x] Parar servidor via API
- [x] Obter status do servidor em tempo real
- [x] Executar comandos via API
- [x] Obter logs do servidor via API

### Sistema de Armazenamento em Nuvem
- [x] Configurar S3 para armazenamento de arquivos
- [x] Upload de mundos para S3
- [x] Upload de backups para S3
- [x] Upload de arquivos de configuração para S3
- [ ] Sistema de cache para otimização
- [ ] Gerenciamento de quota de armazenamento por usuário

### Sistema de Notificações
- [ ] Notificação quando servidor iniciar
- [ ] Notificação quando servidor parar
- [ ] Notificação quando servidor crashar
- [ ] Notificação quando jogador entrar
- [ ] Notificação quando jogador sair
- [ ] Notificação quando backup for concluído
- [ ] Configurações de preferências de notificação
- [ ] Sistema de notificações in-app
- [ ] Integração com email (opcional)

### Interface Frontend
- [x] Landing page atrativa com informações sobre o serviço
- [x] Design espacial/futurista seguindo tema SpaceHost
- [x] Dashboard responsivo com lista de servidores
- [x] Modal de criação de servidor com validação
- [x] Painel de gerenciamento com navegação por abas
- [x] Estados de loading e erro bem definidos
- [x] Feedback visual para ações do usuário (toasts)
- [x] Design mobile-first e responsivo

### Testes e Validação
- [ ] Testes unitários com vitest para routers
- [ ] Testes de integração para API Aternos
- [ ] Testes de upload/download de arquivos
- [ ] Testes de sistema de backup
- [ ] Validação de formulários no frontend
- [ ] Validação de dados no backend com Zod

### Segurança e Performance
- [ ] Validação de tamanho de arquivos (limite 1GB para mundos)
- [ ] Sanitização de nomes de arquivos
- [ ] Rate limiting para operações críticas
- [ ] Proteção contra CSRF
- [ ] Logs de auditoria para ações administrativas
- [ ] Otimização de queries do banco de dados
- [ ] Cache de dados frequentemente acessados
