import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("servers.create", () => {
  it("should create a server with valid data", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const serverData = {
      name: "Test Server",
      version: "1.20.1",
      software: "vanilla" as const,
      slots: 20,
      difficulty: "normal" as const,
      gamemode: "survival" as const,
      worldType: "default",
      pvpEnabled: true,
      whitelistEnabled: false,
      crackedEnabled: false,
      commandBlocksEnabled: false,
      netherEnabled: true,
      animalsEnabled: true,
      monstersEnabled: true,
      spawnProtection: 16,
      forceGamemode: false,
    };

    const result = await caller.servers.create(serverData);

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("name", "Test Server");
    expect(result).toHaveProperty("address");
    expect(result).toHaveProperty("port");
    expect(result.address).toMatch(/\.spacehost\.cloud$/);
    expect(result.port).toBeGreaterThan(0);
    expect(result.port).toBeLessThanOrEqual(65535);
  });

  it("should reject server creation with invalid name", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const serverData = {
      name: "AB", // Too short
      version: "1.20.1",
      software: "vanilla" as const,
      slots: 20,
      difficulty: "normal" as const,
      gamemode: "survival" as const,
      worldType: "default",
      pvpEnabled: true,
      whitelistEnabled: false,
      crackedEnabled: false,
      commandBlocksEnabled: false,
      netherEnabled: true,
      animalsEnabled: true,
      monstersEnabled: true,
      spawnProtection: 16,
      forceGamemode: false,
    };

    await expect(caller.servers.create(serverData)).rejects.toThrow();
  });
});

describe("servers.list", () => {
  it("should return list of servers for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.servers.list();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("servers.get", () => {
  it("should return server details for valid server ID", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a server
    const serverData = {
      name: "Get Test Server",
      version: "1.20.1",
      software: "vanilla" as const,
      slots: 20,
      difficulty: "normal" as const,
      gamemode: "survival" as const,
      worldType: "default",
      pvpEnabled: true,
      whitelistEnabled: false,
      crackedEnabled: false,
      commandBlocksEnabled: false,
      netherEnabled: true,
      animalsEnabled: true,
      monstersEnabled: true,
      spawnProtection: 16,
      forceGamemode: false,
    };

    const created = await caller.servers.create(serverData);
    const result = await caller.servers.get({ serverId: created.id });

    expect(result).toHaveProperty("id", created.id);
    expect(result).toHaveProperty("name", "Get Test Server");
  });

  it("should throw error for non-existent server", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.servers.get({ serverId: 999999 })).rejects.toThrow();
  });
});
