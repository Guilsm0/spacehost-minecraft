import { createConnection } from "net";
import { promisify } from "util";

/**
 * Minecraft Server Discovery Module
 * Localiza e obtém informações de servidores Minecraft externos
 */

interface ServerInfo {
  address: string;
  port: number;
  version: string;
  motd: string;
  maxPlayers: number;
  onlinePlayers: number;
  favicon?: string;
  latency: number;
}

interface PingResponse {
  version: {
    name: string;
    protocol: number;
  };
  players: {
    max: number;
    online: number;
    sample?: Array<{ name: string; id: string }>;
  };
  description: {
    text: string;
  };
  favicon?: string;
}

/**
 * Descobre informações de um servidor Minecraft via protocolo Minecraft
 */
export async function discoverMinecraftServer(
  address: string,
  port: number = 25565,
  timeout: number = 5000
): Promise<ServerInfo> {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ host: address, port });
    const startTime = Date.now();

    socket.setTimeout(timeout);

    socket.on("connect", () => {
      try {
        // Enviar handshake packet
        const handshakePacket = createHandshakePacket(address, port);
        socket.write(handshakePacket);

        // Enviar status request
        const statusRequest = Buffer.from([0x00]); // Status request packet ID
        const statusRequestWithLength = createPacketWithLength(statusRequest);
        socket.write(statusRequestWithLength);
      } catch (error) {
        socket.destroy();
        reject(new Error(`Erro ao enviar pacotes: ${error}`));
      }
    });

    socket.on("data", (data) => {
      try {
        const latency = Date.now() - startTime;
        const response = parseStatusResponse(data);

        if (response) {
          socket.destroy();
          resolve({
            address,
            port,
            version: response.version.name,
            motd: response.description.text,
            maxPlayers: response.players.max,
            onlinePlayers: response.players.online,
            favicon: response.favicon,
            latency,
          });
        }
      } catch (error) {
        socket.destroy();
        reject(new Error(`Erro ao processar resposta: ${error}`));
      }
    });

    socket.on("error", (error) => {
      socket.destroy();
      reject(new Error(`Erro de conexão: ${error.message}`));
    });

    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error(`Timeout ao conectar ao servidor (${timeout}ms)`));
    });
  });
}

/**
 * Cria um pacote Handshake para o protocolo Minecraft
 */
function createHandshakePacket(address: string, port: number): Buffer {
  const protocolVersion = 765; // 1.20.1
  const nextState = 1; // Status

  const addressBuffer = Buffer.from(address, "utf-8");
  const addressLength = addressBuffer.length;

  // Construir payload
  const payload = Buffer.allocUnsafe(
    1 + // Packet ID (0x00)
    getVarIntSize(protocolVersion) +
    1 +
    addressLength +
    2 +
    1 // Next state
  );

  let offset = 0;
  payload[offset++] = 0x00; // Handshake packet ID
  offset += writeVarInt(protocolVersion, payload, offset);
  offset += writeString(address, payload, offset);
  payload.writeUInt16BE(port, offset);
  offset += 2;
  payload[offset++] = nextState;

  return createPacketWithLength(payload);
}

/**
 * Cria um pacote com comprimento prefixado (VarInt)
 */
function createPacketWithLength(packet: Buffer): Buffer {
  const length = Buffer.allocUnsafe(getVarIntSize(packet.length));
  writeVarInt(packet.length, length, 0);
  return Buffer.concat([length, packet]);
}

/**
 * Escreve um VarInt no buffer
 */
function writeVarInt(value: number, buffer: Buffer, offset: number): number {
  let numWrite = 0;
  while ((value & 0xffffff80) !== 0) {
    buffer[offset + numWrite] = (value & 0x7f) | 0x80;
    numWrite++;
    value >>>= 7;
  }
  buffer[offset + numWrite] = value & 0x7f;
  return numWrite + 1;
}

/**
 * Obtém o tamanho de um VarInt
 */
function getVarIntSize(value: number): number {
  if ((value & 0xffffff80) === 0) return 1;
  if ((value & 0xffffc000) === 0) return 2;
  if ((value & 0xffe00000) === 0) return 3;
  if ((value & 0xf0000000) === 0) return 4;
  return 5;
}

/**
 * Escreve uma string no buffer
 */
function writeString(str: string, buffer: Buffer, offset: number): number {
  const strBuffer = Buffer.from(str, "utf-8");
  const length = strBuffer.length;
  const lengthSize = writeVarInt(length, buffer, offset);
  strBuffer.copy(buffer, offset + lengthSize);
  return lengthSize + length;
}

/**
 * Lê um VarInt do buffer
 */
function readVarInt(buffer: Buffer, offset: number): [number, number] {
  let value = 0;
  let numRead = 0;
  let byte: number;

  do {
    byte = buffer[offset + numRead];
    value |= (byte & 0x7f) << (7 * numRead);
    numRead++;
    if (numRead > 5) throw new Error("VarInt muito grande");
  } while ((byte & 0x80) !== 0);

  return [value, numRead];
}

/**
 * Lê uma string do buffer
 */
function readString(buffer: Buffer, offset: number): [string, number] {
  const [length, lengthSize] = readVarInt(buffer, offset);
  const str = buffer.toString("utf-8", offset + lengthSize, offset + lengthSize + length);
  return [str, lengthSize + length];
}

/**
 * Analisa a resposta de status do servidor
 */
function parseStatusResponse(data: Buffer): PingResponse | null {
  try {
    // Pular o comprimento do pacote (VarInt)
    const [, lengthSize] = readVarInt(data, 0);
    let offset = lengthSize;

    // Ler o ID do pacote (0x00 para status response)
    const [packetId, packetIdSize] = readVarInt(data, offset);
    offset += packetIdSize;

    if (packetId !== 0x00) return null;

    // Ler a string JSON
    const [jsonStr] = readString(data, offset);
    const response = JSON.parse(jsonStr) as PingResponse;

    return response;
  } catch (error) {
    console.error("Erro ao analisar resposta:", error);
    return null;
  }
}

/**
 * Valida um endereço de servidor (IP ou domínio)
 */
export function validateServerAddress(address: string): boolean {
  // Validar IP
  const ipRegex =
    /^(\d{1,3}\.){3}\d{1,3}$|^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return ipRegex.test(address);
}

/**
 * Resolve hostname para IP (se necessário)
 */
export async function resolveServerAddress(address: string): Promise<string> {
  const dns = require("dns").promises;

  // Se já é um IP, retornar como está
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(address)) {
    return address;
  }

  // Resolver domínio para IP
  try {
    const result = await dns.resolve4(address);
    return result[0];
  } catch (error) {
    throw new Error(`Não foi possível resolver o endereço: ${address}`);
  }
}
