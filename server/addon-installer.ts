/**
 * Addon Installer Module
 * Gerencia instalação automática de plugins e mods
 */

interface AddonInfo {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  downloads: number;
  rating: number;
  compatible: string[];
  downloadUrl: string;
  fileSize: number;
}

interface InstallationResult {
  success: boolean;
  addonName: string;
  version: string;
  message: string;
  timestamp: Date;
}

/**
 * Busca plugins no CurseForge
 */
export async function searchCurseForgePlugins(
  query: string,
  gameVersion: string = "1.20.1",
  limit: number = 20
): Promise<AddonInfo[]> {
  try {
    const response = await fetch(
      `https://api.curseforge.com/v1/mods/search?gameId=432&searchFilter=${query}&gameVersion=${gameVersion}&pageSize=${limit}`,
      {
        headers: {
          "x-api-key": process.env.CURSEFORGE_API_KEY || "",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CurseForge API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.map((mod: any) => ({
      id: mod.id.toString(),
      name: mod.name,
      description: mod.summary,
      version: mod.latestFilesIndexes[0]?.gameVersion || "unknown",
      author: mod.authors[0]?.name || "Unknown",
      downloads: mod.downloadCount,
      rating: mod.rating || 0,
      compatible: mod.latestFilesIndexes.map((f: any) => f.gameVersion),
      downloadUrl: mod.links.websiteUrl,
      fileSize: mod.latestFilesIndexes[0]?.fileLength || 0,
    }));
  } catch (error) {
    console.error("Erro ao buscar plugins CurseForge:", error);
    return [];
  }
}

/**
 * Busca mods no Modrinth
 */
export async function searchModrinthMods(
  query: string,
  gameVersion: string = "1.20.1",
  limit: number = 20
): Promise<AddonInfo[]> {
  try {
    const response = await fetch(
      `https://api.modrinth.com/v2/search?query=${query}&filters=versions:"${gameVersion}"&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Modrinth API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.hits.map((mod: any) => ({
      id: mod.project_id,
      name: mod.title,
      description: mod.description,
      version: mod.latest_version || "unknown",
      author: mod.author,
      downloads: mod.downloads,
      rating: mod.rating || 0,
      compatible: mod.versions || [],
      downloadUrl: `https://modrinth.com/mod/${mod.slug}`,
      fileSize: 0,
    }));
  } catch (error) {
    console.error("Erro ao buscar mods Modrinth:", error);
    return [];
  }
}

/**
 * Instala um plugin/mod no servidor
 */
export async function installAddon(
  addonId: string,
  addonName: string,
  downloadUrl: string,
  serverPath: string,
  addonType: "plugin" | "mod" = "plugin"
): Promise<InstallationResult> {
  try {
    const fs = require("fs").promises;
    const path = require("path");
    const https = require("https");

    // Criar diretório se não existir
    const pluginDir = path.join(serverPath, addonType === "plugin" ? "plugins" : "mods");
    await fs.mkdir(pluginDir, { recursive: true });

    // Download do arquivo
    const fileName = `${addonName}.jar`;
    const filePath = path.join(pluginDir, fileName);

    await downloadFile(downloadUrl, filePath);

    return {
      success: true,
      addonName,
      version: "1.0.0",
      message: `${addonName} instalado com sucesso!`,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      success: false,
      addonName,
      version: "unknown",
      message: `Erro ao instalar ${addonName}: ${error}`,
      timestamp: new Date(),
    };
  }
}

/**
 * Desinstala um plugin/mod
 */
export async function uninstallAddon(
  addonName: string,
  serverPath: string,
  addonType: "plugin" | "mod" = "plugin"
): Promise<InstallationResult> {
  try {
    const fs = require("fs").promises;
    const path = require("path");

    const addonDir = path.join(serverPath, addonType === "plugin" ? "plugins" : "mods");
    const filePath = path.join(addonDir, `${addonName}.jar`);

    await fs.unlink(filePath);

    return {
      success: true,
      addonName,
      version: "unknown",
      message: `${addonName} desinstalado com sucesso!`,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      success: false,
      addonName,
      version: "unknown",
      message: `Erro ao desinstalar ${addonName}: ${error}`,
      timestamp: new Date(),
    };
  }
}

/**
 * Atualiza um plugin/mod
 */
export async function updateAddon(
  addonName: string,
  newVersion: string,
  downloadUrl: string,
  serverPath: string,
  addonType: "plugin" | "mod" = "plugin"
): Promise<InstallationResult> {
  try {
    // Desinstalar versão antiga
    await uninstallAddon(addonName, serverPath, addonType);

    // Instalar nova versão
    const result = await installAddon(addonName, addonName, downloadUrl, serverPath, addonType);

    if (result.success) {
      result.version = newVersion;
      result.message = `${addonName} atualizado para v${newVersion}!`;
    }

    return result;
  } catch (error) {
    return {
      success: false,
      addonName,
      version: newVersion,
      message: `Erro ao atualizar ${addonName}: ${error}`,
      timestamp: new Date(),
    };
  }
}

/**
 * Lista todos os plugins/mods instalados
 */
export async function listInstalledAddons(
  serverPath: string,
  addonType: "plugin" | "mod" = "plugin"
): Promise<string[]> {
  try {
    const fs = require("fs").promises;
    const path = require("path");

    const addonDir = path.join(serverPath, addonType === "plugin" ? "plugins" : "mods");

    try {
      const files = await fs.readdir(addonDir);
      return files.filter((f: string) => f.endsWith(".jar"));
    } catch {
      return [];
    }
  } catch (error) {
    console.error("Erro ao listar addons:", error);
    return [];
  }
}

/**
 * Download de arquivo auxiliar
 */
function downloadFile(url: string, destination: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const https = require("https");
    const fs = require("fs");

    const file = fs.createWriteStream(destination);

    https
      .get(url, (response: any) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err: any) => {
        fs.unlink(destination, () => {});
        reject(err);
      });
  });
}

/**
 * Valida compatibilidade de addon com versão do servidor
 */
export function validateAddonCompatibility(
  addonCompatibleVersions: string[],
  serverVersion: string
): boolean {
  return addonCompatibleVersions.includes(serverVersion) || addonCompatibleVersions.length === 0;
}
