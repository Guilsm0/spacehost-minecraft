# Melhorias Implementadas - SpaceHost Minecraft

## Resumo das Mudanças

Este documento descreve as melhorias implementadas no sistema de gerenciamento de mundos, upload/download e backups do SpaceHost Minecraft.

---

## 1. Gerador de Mundo com WorldGeneratorApi.jar

### Arquivos Modificados/Criados:
- **`server/world-generator-api.ts`** - Nova integração com WorldGeneratorApi.jar
- **`server/routers.ts`** - Adicionado router `worlds.generate`

### Funcionalidades:
- ✅ Geração automática de mundos via API
- ✅ Suporte para diferentes tipos de mundo (Default, Flat, Large Biomes, Amplified)
- ✅ Configuração de seed, dificuldade, PVP, spawn protection
- ✅ Validação automática da estrutura do mundo gerado
- ✅ Fallback para criação básica se o JAR não estiver disponível

### Como Usar:
```typescript
// Backend
const world = await trpc.worlds.generate.mutate({
  serverId: 1,
  name: "Meu Mundo",
  worldType: "default",
  seed: "12345", // opcional
  difficulty: "normal",
  pvp: true,
  spawnProtection: 16,
  commandBlocks: false,
  netherEnabled: true,
});
```

---

## 2. Sistema de Upload de Mundos

### Arquivos Modificados/Criados:
- **`server/world-file-manager.ts`** - Gerenciador de arquivos de mundos
- **`server/routers.ts`** - Adicionado router `worlds.upload`
- **`client/src/components/server-tabs/WorldsTabImproved.tsx`** - Interface de upload

### Funcionalidades:
- ✅ Aceita apenas arquivos `.world` ou `.zip`
- ✅ Validação de estrutura do mundo (level.dat, session.lock, region, playerdata)
- ✅ Backup automático do mundo atual antes de substituir
- ✅ Limite de tamanho: 1GB
- ✅ Extração e validação automática

### Como Usar:
```typescript
// Frontend
const file = new File([...], "meu-mundo.zip");
const buffer = await file.arrayBuffer();

await trpc.worlds.upload.mutate({
  serverId: 1,
  fileName: "meu-mundo.zip",
  fileData: new Uint8Array(buffer),
});
```

---

## 3. Sistema de Download de Mundos

### Arquivos Modificados/Criados:
- **`server/world-file-manager.ts`** - Função `compressWorldForDownload`
- **`server/routers.ts`** - Adicionado router `worlds.download`
- **`client/src/components/server-tabs/WorldsTabImproved.tsx`** - Botão de download

### Funcionalidades:
- ✅ Compactação automática do mundo em ZIP
- ✅ Upload para storage (S3)
- ✅ Geração de URL de download
- ✅ Limpeza automática de arquivos temporários
- ✅ Limite de tamanho validado (1GB)

### Como Usar:
```typescript
// Frontend
const result = await trpc.worlds.download.refetch();
if (result.data?.downloadUrl) {
  window.open(result.data.downloadUrl, "_blank");
}
```

---

## 4. Sistema de Backup de Mundos

### Arquivos Modificados/Criados:
- **`server/world-file-manager.ts`** - Função `cloneWorldForBackup`
- **`server/routers.ts`** - Adicionado router `worlds.backup`
- **`server/db.ts`** - Função `createWorldBackup`
- **`client/src/components/server-tabs/BackupsTabImproved.tsx`** - Interface de backups

### Funcionalidades:
- ✅ Clonagem completa do mundo para backup
- ✅ Rastreamento de backups no banco de dados
- ✅ Backup automático antes de substituir mundo
- ✅ Nomeação customizável de backups
- ✅ Download de backups individuais
- ✅ Deleção de backups

### Como Usar:
```typescript
// Frontend
await trpc.worlds.backup.mutate({
  worldId: 1,
  backupName: "Backup Antes da Atualização",
});
```

---

## 5. Banco de Dados

### Tabela Criada: `worlds`

```sql
CREATE TABLE worlds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  serverId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  worldPath VARCHAR(500) NOT NULL,
  fileKey VARCHAR(500),
  fileUrl TEXT,
  size BIGINT DEFAULT 0,
  worldType VARCHAR(50) DEFAULT 'default',
  seed VARCHAR(100),
  difficulty ENUM('peaceful', 'easy', 'normal', 'hard') DEFAULT 'normal',
  isActive BOOLEAN DEFAULT true,
  isBackup BOOLEAN DEFAULT false,
  backupOf INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Funções Adicionadas em `db.ts`:
- `createWorld()` - Criar novo mundo
- `getWorldById()` - Obter mundo por ID
- `getWorldsByServerId()` - Listar mundos de um servidor
- `getActiveWorldByServerId()` - Obter mundo ativo
- `getWorldBackups()` - Listar backups de um mundo
- `updateWorld()` - Atualizar informações do mundo
- `deleteWorld()` - Deletar mundo
- `setActiveWorld()` - Ativar mundo
- `createWorldBackup()` - Criar backup de mundo

---

## 6. Interface Frontend

### Componentes Criados/Modificados:

#### `WorldsTabImproved.tsx`
- Dialog para gerar novo mundo com configurações
- Upload de arquivos `.world` ou `.zip`
- Download do mundo ativo
- Lista de mundos com status (ativo/backup)
- Botões para backup e deleção
- Validação de formatos de arquivo

#### `BackupsTabImproved.tsx`
- Seção de backups de mundos (clones)
- Seção de backups do servidor
- Status visual de backups (concluído, em progresso, falhou)
- Download de backups
- Deleção de backups

---

## 7. Estrutura de Diretórios

```
servers-data/
├── [server-slug]/
│   ├── worlds/
│   │   ├── current/
│   │   │   ├── region/
│   │   │   ├── playerdata/
│   │   │   ├── level.dat
│   │   │   ├── session.lock
│   │   │   └── uid.dat
│   │   ├── [mundo-1]/
│   │   ├── [mundo-2]/
│   │   ├── [mundo-1_backup_timestamp]/
│   │   └── [mundo-2_backup_timestamp]/
│   ├── temp/
│   │   └── [timestamp]/
│   │       ├── [arquivo-upload]
│   │       └── extracted/
│   └── downloads/
│       └── [mundo_timestamp.zip]
```

---

## 8. Rotas tRPC Adicionadas

### `worlds` router:

```typescript
// Listar mundos
worlds.list({ serverId: number })

// Obter mundo ativo
worlds.getActive({ serverId: number })

// Gerar novo mundo
worlds.generate({
  serverId: number,
  name: string,
  worldType: "default" | "flat" | "large_biomes" | "amplified",
  seed?: string,
  difficulty: "peaceful" | "easy" | "normal" | "hard",
  pvp: boolean,
  spawnProtection: number,
  commandBlocks: boolean,
  netherEnabled: boolean,
})

// Upload de mundo
worlds.upload({
  serverId: number,
  fileName: string,
  fileData: Uint8Array,
})

// Download de mundo
worlds.download({ worldId: number })
// Retorna: { downloadUrl: string }

// Criar backup
worlds.backup({
  worldId: number,
  backupName: string,
})

// Deletar mundo
worlds.delete({ worldId: number })
```

---

## 9. Validações e Segurança

- ✅ Validação de extensão de arquivo (.world, .zip)
- ✅ Validação de estrutura de mundo (level.dat, session.lock, region, playerdata)
- ✅ Limite de tamanho de arquivo (1GB)
- ✅ Verificação de permissão de usuário (apenas proprietário do servidor)
- ✅ Limpeza automática de arquivos temporários
- ✅ Backup automático antes de substituir mundo
- ✅ Tratamento de erros com mensagens descritivas

---

## 10. Logs de Eventos

Todos os eventos de mundo são registrados em `server_events`:

- `config_change` - Mundo gerado, importado ou deletado
- `backup_created` - Backup criado
- `backup_restored` - Backup restaurado (futuro)

---

## 11. Próximas Melhorias Sugeridas

- [ ] Restauração de backups (reverter para versão anterior)
- [ ] Agendamento automático de backups
- [ ] Compressão automática de mundos antigos
- [ ] Integração com Discord para notificações
- [ ] Estatísticas de tamanho de mundos
- [ ] Suporte a múltiplos mundos simultâneos
- [ ] Editor de configurações de mundo (level.dat)
- [ ] Preview de mundos antes de importar

---

## 12. Dependências Necessárias

Certifique-se de que as seguintes dependências estão instaladas:

```json
{
  "adm-zip": "^0.5.10",
  "zlib": "built-in"
}
```

Se `adm-zip` não estiver instalado, execute:
```bash
npm install adm-zip
# ou
pnpm add adm-zip
```

---

## 13. Configuração do WorldGeneratorApi.jar

1. Coloque o arquivo `WorldGeneratorApi.jar` na raiz do projeto
2. Certifique-se de que Java está instalado no servidor
3. O sistema tentará usar a API automaticamente; se falhar, criará uma estrutura básica

---

## 14. Testes

Para testar as funcionalidades:

### Gerar Mundo:
```bash
curl -X POST http://localhost:3000/api/trpc/worlds.generate \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": 1,
    "name": "TestWorld",
    "worldType": "default",
    "difficulty": "normal"
  }'
```

### Upload de Mundo:
```bash
# Use o formulário no frontend ou envie via FormData
```

### Download de Mundo:
```bash
curl -X GET http://localhost:3000/api/trpc/worlds.download?worldId=1
```

---

## 15. Troubleshooting

### Erro: "WorldGeneratorApi not available"
- Verifique se o arquivo `WorldGeneratorApi.jar` está na raiz do projeto
- Verifique se Java está instalado: `java -version`
- O sistema usará fallback automático

### Erro: "Arquivo deve ser .world ou .zip"
- Certifique-se de que o arquivo tem a extensão correta
- Renomeie o arquivo se necessário

### Erro: "Estrutura do mundo inválida"
- O arquivo não contém os arquivos necessários (level.dat, session.lock, etc.)
- Verifique se é um mundo Minecraft válido

### Erro: "Mundo muito grande"
- O arquivo excede 1GB
- Comprima o mundo ou remova dados desnecessários

---

## 16. Suporte

Para mais informações ou suporte, consulte:
- Documentação do Minecraft: https://minecraft.wiki/
- Repositório do SpaceHost: https://github.com/Guilsm0/spacehost-minecraft
