import { promises as fs } from "fs";
import * as path from "path";
import { spawn } from "child_process";
import { randomBytes } from "crypto";

/**
 * World Generator API Integration
 * Integra o WorldGeneratorApi.jar para gerar mundos Minecraft
 */

export interface WorldGenerationConfig {
  name: string;
  seed?: string;
  worldType: "default" | "flat" | "large_biomes" | "amplified";
  difficulty: "peaceful" | "easy" | "normal" | "hard";
  pvp: boolean;
  spawnProtection: number;
  commandBlocks: boolean;
  netherEnabled: boolean;
}

/**
 * Gera um seed aleatório
 */
export function generateRandomSeed(): string {
  return randomBytes(8).readBigInt64BE().toString();
}

/**
 * Executa o WorldGeneratorApi.jar para gerar um mundo
 */
export async function generateWorldWithApi(
  jarPath: string,
  outputPath: string,
  config: WorldGenerationConfig
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const args = [
      "-jar",
      jarPath,
      "--name",
      config.name,
      "--seed",
      config.seed || generateRandomSeed(),
      "--type",
      mapWorldType(config.worldType),
      "--difficulty",
      config.difficulty,
      "--output",
      outputPath,
      "--pvp",
      config.pvp ? "true" : "false",
      "--spawn-protection",
      config.spawnProtection.toString(),
      "--command-blocks",
      config.commandBlocks ? "true" : "false",
      "--nether",
      config.netherEnabled ? "true" : "false",
    ];

    const process = spawn("java", args, {
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 300000, // 5 minutos timeout
    });

    let output = "";
    let errorOutput = "";

    process.stdout?.on("data", (data) => {
      output += data.toString();
      console.log(`[WorldGenerator] ${data.toString()}`);
    });

    process.stderr?.on("data", (data) => {
      errorOutput += data.toString();
      console.error(`[WorldGenerator Error] ${data.toString()}`);
    });

    process.on("close", (code) => {
      if (code === 0) {
        console.log(`[WorldGenerator] Mundo gerado com sucesso`);
        resolve(true);
      } else {
        console.error(`[WorldGenerator] Erro ao gerar mundo: código ${code}`);
        reject(new Error(`WorldGenerator failed with code ${code}: ${errorOutput}`));
      }
    });

    process.on("error", (error) => {
      console.error(`[WorldGenerator] Erro ao executar: ${error.message}`);
      reject(error);
    });
  });
}

/**
 * Mapeia tipos de mundo para o formato esperado pelo WorldGeneratorApi
 */
function mapWorldType(type: string): string {
  const map: Record<string, string> = {
    default: "normal",
    flat: "flat",
    large_biomes: "large_biomes",
    amplified: "amplified",
  };
  return map[type] || "normal";
}

/**
 * Valida a estrutura do mundo gerado
 */
export async function validateGeneratedWorld(worldPath: string): Promise<boolean> {
  try {
    const requiredFiles = ["level.dat", "session.lock"];
    const requiredDirs = ["region", "playerdata"];

    for (const file of requiredFiles) {
      const filePath = path.join(worldPath, file);
      try {
        await fs.access(filePath);
      } catch {
        console.warn(`[WorldValidator] Arquivo ausente: ${file}`);
        return false;
      }
    }

    for (const dir of requiredDirs) {
      const dirPath = path.join(worldPath, dir);
      try {
        const stats = await fs.stat(dirPath);
        if (!stats.isDirectory()) {
          console.warn(`[WorldValidator] Não é um diretório: ${dir}`);
          return false;
        }
      } catch {
        console.warn(`[WorldValidator] Diretório ausente: ${dir}`);
        return false;
      }
    }

    console.log(`[WorldValidator] Mundo validado com sucesso`);
    return true;
  } catch (error) {
    console.error(`[WorldValidator] Erro na validação: ${error}`);
    return false;
  }
}

/**
 * Calcula o tamanho total de um diretório
 */
export async function getDirectorySize(dirPath: string): Promise<number> {
  let size = 0;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        size += await getDirectorySize(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        size += stats.size;
      }
    }

    return size;
  } catch (error) {
    console.error(`[DirectorySize] Erro ao calcular tamanho: ${error}`);
    return 0;
  }
}

/**
 * Cria um arquivo level.dat básico (NBT format simplificado)
 */
export async function createLevelDat(
  worldPath: string,
  config: WorldGenerationConfig
): Promise<void> {
  const levelDatPath = path.join(worldPath, "level.dat");

  const data = {
    Data: {
      DataVersion: 3465,
      LevelName: config.name,
      Seed: config.seed || generateRandomSeed(),
      GameType: 0, // Survival
      Difficulty: getDifficultyValue(config.difficulty),
      DifficultyLocked: false,
      Time: 0,
      DayTime: 0,
      SpawnX: 0,
      SpawnY: 64,
      SpawnZ: 0,
      BorderCenterX: 0.0,
      BorderCenterZ: 0.0,
      BorderSize: 59999968.0,
      BorderSafeZone: 29999984.0,
      BorderWarningBlocks: 5,
      BorderWarningTime: 15,
      PvP: config.pvp,
      AllowCommands: config.commandBlocks,
      NetherEnabled: config.netherEnabled,
      SpawnProtection: config.spawnProtection,
    },
  };

  try {
    await fs.writeFile(levelDatPath, JSON.stringify(data, null, 2));
    console.log(`[LevelDat] Arquivo level.dat criado`);
  } catch (error) {
    console.error(`[LevelDat] Erro ao criar level.dat: ${error}`);
    throw error;
  }
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
