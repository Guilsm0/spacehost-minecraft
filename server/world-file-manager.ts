import { promises as fs } from "fs";
import * as path from "path";
import * as zlib from "zlib";
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { getDirectorySize } from "./world-generator-api";

/**
 * World File Manager
 * Gerencia upload, download e backup de mundos Minecraft
 */

const MAX_WORLD_SIZE = 1024 * 1024 * 1024; // 1GB

/**
 * Valida se um arquivo é um mundo válido (.world ou .zip)
 */
export function isValidWorldFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ext === ".world" || ext === ".zip";
}

/**
 * Valida a estrutura de um mundo extraído
 */
export async function validateWorldStructure(worldPath: string): Promise<boolean> {
  try {
    const requiredFiles = ["level.dat", "session.lock"];
    const requiredDirs = ["region", "playerdata"];

    for (const file of requiredFiles) {
      const filePath = path.join(worldPath, file);
      try {
        await fs.access(filePath);
      } catch {
        console.warn(`[WorldValidation] Arquivo ausente: ${file}`);
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
        console.warn(`[WorldValidation] Diretório ausente: ${dir}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error(`[WorldValidation] Erro na validação: ${error}`);
    return false;
  }
}

/**
 * Extrai um arquivo .world ou .zip
 */
export async function extractWorldFile(
  filePath: string,
  extractPath: string
): Promise<boolean> {
  try {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === ".zip") {
      // Usar unzip para extrair
      const AdmZip = require("adm-zip");
      const zip = new AdmZip(filePath);
      zip.extractAllTo(extractPath, true);
    } else if (ext === ".world") {
      // Tratar .world como arquivo comprimido
      await new Promise((resolve, reject) => {
        pipeline(
          createReadStream(filePath),
          zlib.createGunzip(),
          createWriteStream(extractPath),
          (err) => {
            if (err) reject(err);
            else resolve(null);
          }
        );
      });
    }

    console.log(`[WorldExtraction] Mundo extraído com sucesso`);
    return true;
  } catch (error) {
    console.error(`[WorldExtraction] Erro ao extrair: ${error}`);
    return false;
  }
}

/**
 * Compacta um mundo para download
 */
export async function compressWorldForDownload(
  worldPath: string,
  outputPath: string
): Promise<boolean> {
  try {
    // Verificar tamanho
    const size = await getDirectorySize(worldPath);
    if (size > MAX_WORLD_SIZE) {
      throw new Error(`Mundo muito grande: ${size} bytes (máximo: ${MAX_WORLD_SIZE} bytes)`);
    }

    // Usar adm-zip para criar arquivo zip
    const AdmZip = require("adm-zip");
    const zip = new AdmZip();

    // Adicionar todos os arquivos do mundo
    const addFilesToZip = async (dir: string, zipPath: string = "") => {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const zipFilePath = path.join(zipPath, entry.name);

        if (entry.isDirectory()) {
          await addFilesToZip(fullPath, zipFilePath);
        } else {
          const fileData = await fs.readFile(fullPath);
          zip.addFile(zipFilePath, fileData);
        }
      }
    };

    await addFilesToZip(worldPath);
    zip.writeZip(outputPath);

    console.log(`[WorldCompression] Mundo compactado com sucesso`);
    return true;
  } catch (error) {
    console.error(`[WorldCompression] Erro ao compactar: ${error}`);
    return false;
  }
}

/**
 * Clona um mundo para backup
 */
export async function cloneWorldForBackup(
  sourcePath: string,
  backupPath: string
): Promise<boolean> {
  try {
    // Criar diretório de backup
    await fs.mkdir(backupPath, { recursive: true });

    // Copiar todos os arquivos recursivamente
    const copyDir = async (src: string, dest: string) => {
      const entries = await fs.readdir(src, { withFileTypes: true });

      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
          await fs.mkdir(destPath, { recursive: true });
          await copyDir(srcPath, destPath);
        } else {
          await fs.copyFile(srcPath, destPath);
        }
      }
    };

    await copyDir(sourcePath, backupPath);

    console.log(`[WorldClone] Mundo clonado com sucesso`);
    return true;
  } catch (error) {
    console.error(`[WorldClone] Erro ao clonar: ${error}`);
    return false;
  }
}

/**
 * Substitui o mundo atual pelo enviado
 */
export async function replaceWorldWithUpload(
  currentWorldPath: string,
  uploadedWorldPath: string
): Promise<boolean> {
  try {
    // Remover mundo atual
    if (await pathExists(currentWorldPath)) {
      await fs.rm(currentWorldPath, { recursive: true, force: true });
    }

    // Criar diretório para novo mundo
    await fs.mkdir(currentWorldPath, { recursive: true });

    // Copiar mundo enviado
    const copyDir = async (src: string, dest: string) => {
      const entries = await fs.readdir(src, { withFileTypes: true });

      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
          await fs.mkdir(destPath, { recursive: true });
          await copyDir(srcPath, destPath);
        } else {
          await fs.copyFile(srcPath, destPath);
        }
      }
    };

    await copyDir(uploadedWorldPath, currentWorldPath);

    console.log(`[WorldReplacement] Mundo substituído com sucesso`);
    return true;
  } catch (error) {
    console.error(`[WorldReplacement] Erro ao substituir: ${error}`);
    return false;
  }
}

/**
 * Verifica se um caminho existe
 */
export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove um arquivo ou diretório
 */
export async function removeWorldPath(filePath: string): Promise<void> {
  try {
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      await fs.rm(filePath, { recursive: true, force: true });
    } else {
      await fs.unlink(filePath);
    }
    console.log(`[WorldRemoval] Caminho removido: ${filePath}`);
  } catch (error) {
    console.error(`[WorldRemoval] Erro ao remover: ${error}`);
    throw error;
  }
}
