/**
 * Addons API Integration (CurseForge & Modrinth)
 * Search and download plugins/mods for Minecraft servers
 */

import axios, { AxiosInstance } from 'axios';

export interface AddonSearchResult {
  id: string;
  slug: string;
  name: string;
  description: string;
  author: string;
  downloadCount: number;
  categories: string[];
  iconUrl?: string;
  downloadUrl: string;
  version: string;
  gameVersion: string[];
  source: 'curseforge' | 'modrinth';
}

export class AddonsClient {
  private modrinthClient: AxiosInstance;
  private curseforgeClient: AxiosInstance;

  constructor() {
    // Modrinth API (no auth required for public endpoints)
    this.modrinthClient = axios.create({
      baseURL: 'https://api.modrinth.com/v2',
      timeout: 15000,
      headers: {
        'User-Agent': 'SpaceHost/1.0',
      },
    });

    // CurseForge API (requires API key in production)
    this.curseforgeClient = axios.create({
      baseURL: 'https://api.curseforge.com/v1',
      timeout: 15000,
      headers: {
        'User-Agent': 'SpaceHost/1.0',
        // 'x-api-key': process.env.CURSEFORGE_API_KEY || '',
      },
    });
  }

  /**
   * Search plugins (for Spigot/Paper servers)
   */
  async searchPlugins(query: string, gameVersion?: string, limit: number = 20): Promise<AddonSearchResult[]> {
    try {
      const results: AddonSearchResult[] = [];

      // Search Modrinth for plugins
      const modrinthResponse = await this.modrinthClient.get('/search', {
        params: {
          query,
          facets: JSON.stringify([
            ['project_type:mod'],
            ['categories:bukkit', 'categories:spigot', 'categories:paper'],
            ...(gameVersion ? [[`versions:${gameVersion}`]] : []),
          ]),
          limit,
        },
      });

      if (modrinthResponse.data?.hits) {
        for (const hit of modrinthResponse.data.hits) {
          results.push({
            id: hit.project_id,
            slug: hit.slug,
            name: hit.title,
            description: hit.description,
            author: hit.author || 'Unknown',
            downloadCount: hit.downloads || 0,
            categories: hit.categories || [],
            iconUrl: hit.icon_url,
            downloadUrl: '', // Will be fetched separately
            version: hit.latest_version || 'latest',
            gameVersion: hit.versions || [],
            source: 'modrinth',
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error searching plugins:', error);
      return [];
    }
  }

  /**
   * Search mods (for Forge/Fabric servers)
   */
  async searchMods(query: string, modLoader: 'forge' | 'fabric', gameVersion?: string, limit: number = 20): Promise<AddonSearchResult[]> {
    try {
      const results: AddonSearchResult[] = [];

      // Search Modrinth for mods
      const modrinthResponse = await this.modrinthClient.get('/search', {
        params: {
          query,
          facets: JSON.stringify([
            ['project_type:mod'],
            [`categories:${modLoader}`],
            ...(gameVersion ? [[`versions:${gameVersion}`]] : []),
          ]),
          limit,
        },
      });

      if (modrinthResponse.data?.hits) {
        for (const hit of modrinthResponse.data.hits) {
          results.push({
            id: hit.project_id,
            slug: hit.slug,
            name: hit.title,
            description: hit.description,
            author: hit.author || 'Unknown',
            downloadCount: hit.downloads || 0,
            categories: hit.categories || [],
            iconUrl: hit.icon_url,
            downloadUrl: '', // Will be fetched separately
            version: hit.latest_version || 'latest',
            gameVersion: hit.versions || [],
            source: 'modrinth',
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error searching mods:', error);
      return [];
    }
  }

  /**
   * Get download URL for a specific addon version
   */
  async getDownloadUrl(addonId: string, source: 'modrinth' | 'curseforge', gameVersion?: string): Promise<string> {
    try {
      if (source === 'modrinth') {
        // Get project versions
        const versionsResponse = await this.modrinthClient.get(`/project/${addonId}/version`);
        
        if (versionsResponse.data && versionsResponse.data.length > 0) {
          // Find version matching game version if specified
          let version = versionsResponse.data[0];
          
          if (gameVersion) {
            const matchingVersion = versionsResponse.data.find((v: any) => 
              v.game_versions && v.game_versions.includes(gameVersion)
            );
            if (matchingVersion) {
              version = matchingVersion;
            }
          }

          // Get primary file download URL
          if (version.files && version.files.length > 0) {
            const primaryFile = version.files.find((f: any) => f.primary) || version.files[0];
            return primaryFile.url;
          }
        }
      }

      return '';
    } catch (error) {
      console.error('Error getting download URL:', error);
      return '';
    }
  }

  /**
   * Get addon details
   */
  async getAddonDetails(addonId: string, source: 'modrinth' | 'curseforge'): Promise<AddonSearchResult | null> {
    try {
      if (source === 'modrinth') {
        const response = await this.modrinthClient.get(`/project/${addonId}`);
        const project = response.data;

        return {
          id: project.id,
          slug: project.slug,
          name: project.title,
          description: project.description,
          author: project.team || 'Unknown',
          downloadCount: project.downloads || 0,
          categories: project.categories || [],
          iconUrl: project.icon_url,
          downloadUrl: '', // Will be fetched separately
          version: 'latest',
          gameVersion: project.game_versions || [],
          source: 'modrinth',
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting addon details:', error);
      return null;
    }
  }

  /**
   * Download addon file
   */
  async downloadAddon(downloadUrl: string): Promise<Buffer> {
    try {
      const response = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        timeout: 60000, // 1 minute for large files
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error downloading addon:', error);
      throw new Error('Falha ao baixar addon');
    }
  }

  /**
   * Get popular plugins
   */
  async getPopularPlugins(gameVersion?: string, limit: number = 10): Promise<AddonSearchResult[]> {
    return this.searchPlugins('', gameVersion, limit);
  }

  /**
   * Get popular mods
   */
  async getPopularMods(modLoader: 'forge' | 'fabric', gameVersion?: string, limit: number = 10): Promise<AddonSearchResult[]> {
    return this.searchMods('', modLoader, gameVersion, limit);
  }
}

// Singleton instance
let addonsClient: AddonsClient | null = null;

export function getAddonsClient(): AddonsClient {
  if (!addonsClient) {
    addonsClient = new AddonsClient();
  }
  return addonsClient;
}
