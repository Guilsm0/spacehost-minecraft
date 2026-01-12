import { promises as fs } from "fs";
import * as path from "path";
import { randomBytes } from "crypto";

/**
 * Bedrock Edition World Generator
 * Gera mundos compatíveis com Minecraft Bedrock Edition
 */

export interface BedrockWorldConfig {
  name: string;
  seed?: string;
  gamemode: "survival" | "creative" | "adventure" | "spectator";
  difficulty: "peaceful" | "easy" | "normal" | "hard";
  pvp: boolean;
  commandsEnabled: boolean;
  netherEnabled: boolean;
  endEnabled: boolean;
}

/**
 * Gera um seed aleatório
 */
export function generateRandomSeed(): string {
  return randomBytes(8).readBigInt64BE().toString();
}

/**
 * Cria um mundo Bedrock Edition
 */
export async function createBedrockWorld(
  worldPath: string,
  config: BedrockWorldConfig
): Promise<boolean> {
  try {
    // Criar estrutura de diretórios
    await fs.mkdir(path.join(worldPath, "db"), { recursive: true });
    await fs.mkdir(path.join(worldPath, "behavior_packs"), { recursive: true });
    await fs.mkdir(path.join(worldPath, "resource_packs"), { recursive: true });

    // Criar level.dat (configurações do mundo)
    const levelDat = createBedrockLevelDat(config);
    await fs.writeFile(path.join(worldPath, "level.dat"), levelDat);

    // Criar levelname.txt (nome do mundo)
    await fs.writeFile(path.join(worldPath, "levelname.txt"), config.name);

    // Criar world_icon.png (ícone do mundo - PNG vazio)
    const emptyPng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
      0x52, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00, 0x40, 0x08, 0x02, 0x00, 0x00, 0x00, 0xaa,
      0x69, 0x71, 0xde, 0x00, 0x00, 0x00, 0x19, 0x74, 0x45, 0x58, 0x74, 0x53, 0x6f, 0x66, 0x74,
      0x77, 0x61, 0x72, 0x65, 0x00, 0x41, 0x64, 0x6f, 0x62, 0x65, 0x20, 0x49, 0x6d, 0x61, 0x67,
      0x65, 0x52, 0x65, 0x61, 0x64, 0x79, 0x71, 0xc9, 0x65, 0x3c, 0x00, 0x00, 0x00, 0x1f, 0x49,
      0x44, 0x41, 0x54, 0x78, 0xda, 0x62, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x03, 0x01, 0x01, 0x00,
      0x18, 0xdd, 0x8d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60,
      0x82,
    ]);
    await fs.writeFile(path.join(worldPath, "world_icon.png"), emptyPng);

    // Criar world_behavior_packs.json
    const behaviorPacksJson = {
      packs: [],
    };
    await fs.writeFile(
      path.join(worldPath, "world_behavior_packs.json"),
      JSON.stringify(behaviorPacksJson, null, 2)
    );

    // Criar world_resource_packs.json
    const resourcePacksJson = {
      packs: [],
    };
    await fs.writeFile(
      path.join(worldPath, "world_resource_packs.json"),
      JSON.stringify(resourcePacksJson, null, 2)
    );

    console.log(`[BedrockGenerator] Mundo Bedrock criado com sucesso em ${worldPath}`);
    return true;
  } catch (error) {
    console.error(`[BedrockGenerator] Erro ao criar mundo: ${error}`);
    return false;
  }
}

/**
 * Cria um arquivo level.dat para Bedrock Edition (formato JSON simplificado)
 */
function createBedrockLevelDat(config: BedrockWorldConfig): Buffer {
  const levelData = {
    // Informações básicas
    LevelName: config.name,
    LevelType: "default",
    Version: 17825792, // Versão do Bedrock Edition
    
    // Seed
    RandomSeed: config.seed || generateRandomSeed(),
    
    // Modo de jogo
    GameType: getGamemodeValue(config.gamemode),
    Difficulty: getDifficultyValue(config.difficulty),
    
    // Configurações
    CommandsEnabled: config.commandsEnabled,
    PvpEnabled: config.pvp,
    NetherEnabled: config.netherEnabled,
    
    // Spawn
    SpawnX: 0,
    SpawnY: 64,
    SpawnZ: 0,
    
    // Tempo
    Time: 0,
    DayTime: 0,
    
    // Dados adicionais
    LastPlayed: Date.now(),
    SizeOnDisk: 0,
    
    // Identificadores únicos
    WorldUniqueId: generateUUID(),
    Uuid: generateUUID(),
  };

  return Buffer.from(JSON.stringify(levelData, null, 2), "utf-8");
}

/**
 * Obtém o valor numérico do modo de jogo
 */
function getGamemodeValue(gamemode: string): number {
  const map: Record<string, number> = {
    survival: 0,
    creative: 1,
    adventure: 2,
    spectator: 3,
  };
  return map[gamemode] || 0;
}

/**
 * Obtém o valor numérico da dificuldade
 */
function getDifficultyValue(difficulty: string): number {
  const map: Record<string, number> = {
    peaceful: 0,
    easy: 1,
    normal: 2,
    hard: 3,
  };
  return map[difficulty] || 2;
}

/**
 * Gera um UUID v4 para o mundo
 */
function generateUUID(): string {
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString("hex");
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32),
  ].join("-");
}

/**
 * Valida a estrutura de um mundo Bedrock
 */
export async function validateBedrockWorld(worldPath: string): Promise<boolean> {
  try {
    const requiredFiles = ["level.dat", "levelname.txt"];
    const requiredDirs = ["db"];

    for (const file of requiredFiles) {
      const filePath = path.join(worldPath, file);
      try {
        await fs.access(filePath);
      } catch {
        console.warn(`[BedrockValidator] Arquivo ausente: ${file}`);
        return false;
      }
    }

    for (const dir of requiredDirs) {
      const dirPath = path.join(worldPath, dir);
      try {
        const stats = await fs.stat(dirPath);
        if (!stats.isDirectory()) {
          return false;
        }
      } catch {
        console.warn(`[BedrockValidator] Diretório ausente: ${dir}`);
        return false;
      }
    }

    console.log(`[BedrockValidator] Mundo Bedrock validado com sucesso`);
    return true;
  } catch (error) {
    console.error(`[BedrockValidator] Erro na validação: ${error}`);
    return false;
  }
}
