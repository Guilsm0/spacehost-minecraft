/**
 * Aternos Integration Module
 * Integra com API Aternos para gerenciar servidores multijogador
 * Baseado em: https://github.com/sleeyax/aternos-api.git
 */

interface AternosServerInfo {
  id: string;
  name: string;
  address: string;
  port: number;
  status: "online" | "offline" | "starting" | "stopping" | "crashed";
  players: {
    online: number;
    max: number;
  };
  version: string;
  software: string;
  motd: string;
  ram: {
    used: number;
    total: number;
  };
  uptime: number;
}

interface AternosCredentials {
  username: string;
  password: string;
}

/**
 * Cliente Aternos para gerenciar servidores
 */
export class AternosClient {
  private baseUrl = "https://api.aternos.org/v1";
  private credentials: AternosCredentials;
  private sessionToken?: string;

  constructor(credentials: AternosCredentials) {
    this.credentials = credentials;
  }

  /**
   * Autentica com a API Aternos
   */
  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "SpaceHost/1.0",
        },
        body: JSON.stringify({
          username: this.credentials.username,
          password: this.credentials.password,
        }),
      });

      if (!response.ok) {
        throw new Error(`Autenticação falhou: ${response.statusText}`);
      }

      const data = await response.json() as any;
      this.sessionToken = data.token;
      return true;
    } catch (error) {
      console.error("Erro ao autenticar com Aternos:", error);
      return false;
    }
  }

  /**
   * Lista todos os servidores do usuário
   */
  async listServers(): Promise<AternosServerInfo[]> {
    if (!this.sessionToken) {
      throw new Error("Não autenticado. Execute authenticate() primeiro.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/servers`, {
        headers: {
          Authorization: `Bearer ${this.sessionToken}`,
          "User-Agent": "SpaceHost/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao listar servidores: ${response.statusText}`);
      }

      const data = await response.json() as any;
      return data.servers || [];
    } catch (error) {
      console.error("Erro ao listar servidores:", error);
      return [];
    }
  }

  /**
   * Obtém informações de um servidor específico
   */
  async getServerInfo(serverId: string): Promise<AternosServerInfo | null> {
    if (!this.sessionToken) {
      throw new Error("Não autenticado. Execute authenticate() primeiro.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/servers/${serverId}`, {
        headers: {
          Authorization: `Bearer ${this.sessionToken}`,
          "User-Agent": "SpaceHost/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao obter informações: ${response.statusText}`);
      }

      const data = await response.json() as any;
      return data.server || null;
    } catch (error) {
      console.error("Erro ao obter informações do servidor:", error);
      return null;
    }
  }

  /**
   * Inicia um servidor
   */
  async startServer(serverId: string): Promise<boolean> {
    if (!this.sessionToken) {
      throw new Error("Não autenticado. Execute authenticate() primeiro.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/servers/${serverId}/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.sessionToken}`,
          "User-Agent": "SpaceHost/1.0",
        },
      });

      return response.ok;
    } catch (error) {
      console.error("Erro ao iniciar servidor:", error);
      return false;
    }
  }

  /**
   * Para um servidor
   */
  async stopServer(serverId: string): Promise<boolean> {
    if (!this.sessionToken) {
      throw new Error("Não autenticado. Execute authenticate() primeiro.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/servers/${serverId}/stop`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.sessionToken}`,
          "User-Agent": "SpaceHost/1.0",
        },
      });

      return response.ok;
    } catch (error) {
      console.error("Erro ao parar servidor:", error);
      return false;
    }
  }

  /**
   * Reinicia um servidor
   */
  async restartServer(serverId: string): Promise<boolean> {
    if (!this.sessionToken) {
      throw new Error("Não autenticado. Execute authenticate() primeiro.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/servers/${serverId}/restart`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.sessionToken}`,
          "User-Agent": "SpaceHost/1.0",
        },
      });

      return response.ok;
    } catch (error) {
      console.error("Erro ao reiniciar servidor:", error);
      return false;
    }
  }

  /**
   * Executa um comando no servidor
   */
  async executeCommand(serverId: string, command: string): Promise<boolean> {
    if (!this.sessionToken) {
      throw new Error("Não autenticado. Execute authenticate() primeiro.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/servers/${serverId}/command`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.sessionToken}`,
          "Content-Type": "application/json",
          "User-Agent": "SpaceHost/1.0",
        },
        body: JSON.stringify({ command }),
      });

      return response.ok;
    } catch (error) {
      console.error("Erro ao executar comando:", error);
      return false;
    }
  }

  /**
   * Obtém logs do servidor
   */
  async getServerLogs(serverId: string, limit: number = 100): Promise<string[]> {
    if (!this.sessionToken) {
      throw new Error("Não autenticado. Execute authenticate() primeiro.");
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/servers/${serverId}/logs?limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${this.sessionToken}`,
            "User-Agent": "SpaceHost/1.0",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao obter logs: ${response.statusText}`);
      }

      const data = await response.json() as any;
      return data.logs || [];
    } catch (error) {
      console.error("Erro ao obter logs:", error);
      return [];
    }
  }

  /**
   * Obtém lista de jogadores
   */
  async getPlayersList(serverId: string): Promise<string[]> {
    if (!this.sessionToken) {
      throw new Error("Não autenticado. Execute authenticate() primeiro.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/servers/${serverId}/players`, {
        headers: {
          Authorization: `Bearer ${this.sessionToken}`,
          "User-Agent": "SpaceHost/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao obter lista de jogadores: ${response.statusText}`);
      }

      const data = await response.json() as any;
      return data.players || [];
    } catch (error) {
      console.error("Erro ao obter lista de jogadores:", error);
      return [];
    }
  }

  /**
   * Adiciona jogador à whitelist
   */
  async addToWhitelist(serverId: string, playerName: string): Promise<boolean> {
    if (!this.sessionToken) {
      throw new Error("Não autenticado. Execute authenticate() primeiro.");
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/servers/${serverId}/whitelist/add`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.sessionToken}`,
            "Content-Type": "application/json",
            "User-Agent": "SpaceHost/1.0",
          },
          body: JSON.stringify({ player: playerName }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error("Erro ao adicionar à whitelist:", error);
      return false;
    }
  }

  /**
   * Remove jogador da whitelist
   */
  async removeFromWhitelist(serverId: string, playerName: string): Promise<boolean> {
    if (!this.sessionToken) {
      throw new Error("Não autenticado. Execute authenticate() primeiro.");
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/servers/${serverId}/whitelist/remove`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.sessionToken}`,
            "Content-Type": "application/json",
            "User-Agent": "SpaceHost/1.0",
          },
          body: JSON.stringify({ player: playerName }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error("Erro ao remover da whitelist:", error);
      return false;
    }
  }

  /**
   * Faz backup do servidor
   */
  async createBackup(serverId: string): Promise<boolean> {
    if (!this.sessionToken) {
      throw new Error("Não autenticado. Execute authenticate() primeiro.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/servers/${serverId}/backup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.sessionToken}`,
          "User-Agent": "SpaceHost/1.0",
        },
      });

      return response.ok;
    } catch (error) {
      console.error("Erro ao criar backup:", error);
      return false;
    }
  }

  /**
   * Obtém status em tempo real do servidor
   */
  async getServerStatus(serverId: string): Promise<AternosServerInfo["status"] | null> {
    const serverInfo = await this.getServerInfo(serverId);
    return serverInfo?.status || null;
  }
}

/**
 * Factory para criar cliente Aternos
 */
export function createAternosClient(username: string, password: string): AternosClient {
  return new AternosClient({ username, password });
}
