import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Server,
  LogIn,
  Loader2,
  AlertCircle,
  CheckCircle,
  Users,
  HardDrive,
  Activity,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AternosServer {
  id: string;
  name: string;
  address: string;
  port: number;
  status: "online" | "offline" | "starting" | "stopping";
  players: { online: number; max: number };
  version: string;
}

export default function AternosIntegration() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [servers, setServers] = useState<AternosServer[]>([
    {
      id: "1",
      name: "Servidor Principal",
      address: "play.example.com",
      port: 25565,
      status: "online",
      players: { online: 5, max: 20 },
      version: "1.20.1",
    },
  ]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error("Preencha usuário e senha");
      return;
    }

    setIsLoading(true);

    try {
      // Simular autenticação
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setIsAuthenticated(true);
      toast.success("Conectado ao Aternos com sucesso!");
      setPassword("");
    } catch (error) {
      toast.error("Erro ao conectar ao Aternos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
    toast.success("Desconectado do Aternos");
  };

  const handleStartServer = (serverId: string) => {
    setServers(
      servers.map((s) =>
        s.id === serverId ? { ...s, status: "starting" as const } : s
      )
    );
    setTimeout(() => {
      setServers(
        servers.map((s) =>
          s.id === serverId ? { ...s, status: "online" as const } : s
        )
      );
      toast.success("Servidor iniciado!");
    }, 2000);
  };

  const handleStopServer = (serverId: string) => {
    setServers(
      servers.map((s) =>
        s.id === serverId ? { ...s, status: "stopping" as const } : s
      )
    );
    setTimeout(() => {
      setServers(
        servers.map((s) =>
          s.id === serverId ? { ...s, status: "offline" as const } : s
        )
      );
      toast.success("Servidor parado!");
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-500";
      case "offline":
        return "text-red-500";
      case "starting":
        return "text-yellow-500";
      case "stopping":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "online":
        return "Online";
      case "offline":
        return "Offline";
      case "starting":
        return "Iniciando...";
      case "stopping":
        return "Parando...";
      default:
        return "Desconhecido";
    }
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Integração Aternos
          </CardTitle>
          <CardDescription>
            Conecte-se ao Aternos para gerenciar seus servidores multijogador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Faça login com suas credenciais do Aternos para conectar seus servidores
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="aternos-username">Usuário Aternos</Label>
              <Input
                id="aternos-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="seu_usuario"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aternos-password">Senha</Label>
              <Input
                id="aternos-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="sua_senha"
                disabled={isLoading}
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Conectar ao Aternos
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Servidores Aternos
              </CardTitle>
              <CardDescription>Conectado como {username}</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Desconectar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="servers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="servers">Meus Servidores ({servers.length})</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="servers" className="space-y-4">
            {servers.length > 0 ? (
              <div className="space-y-3">
                {servers.map((server) => (
                  <div
                    key={server.id}
                    className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{server.name}</h4>
                          <div className={`flex items-center gap-1 ${getStatusColor(server.status)}`}>
                            {server.status === "online" ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <AlertCircle className="w-4 h-4" />
                            )}
                            <span className="text-xs font-medium">{getStatusLabel(server.status)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {server.address}:{server.port}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-primary" />
                        <span>
                          {server.players.online}/{server.players.max}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4 text-primary" />
                        <span>{server.version}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="w-4 h-4 text-primary" />
                        <span>Normal</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {server.status === "online" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleStopServer(server.id)}
                        >
                          Parar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleStartServer(server.id)}
                        >
                          Iniciar
                        </Button>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="flex-1">
                            Console
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Console - {server.name}</DialogTitle>
                            <DialogDescription>
                              Visualize e execute comandos no servidor
                            </DialogDescription>
                          </DialogHeader>
                          <div className="bg-black rounded-lg p-4 font-mono text-sm text-green-400 h-64 overflow-y-auto">
                            <p>[10:30:45] [Server thread/INFO]: Starting minecraft server version 1.20.1</p>
                            <p>[10:30:46] [Server thread/INFO]: Loading properties</p>
                            <p>[10:30:47] [Server thread/INFO]: Default game type: SURVIVAL</p>
                            <p>[10:30:48] [Server thread/INFO]: Generating keypair</p>
                            <p>[10:30:49] [Server thread/INFO]: Starting Minecraft server on *:25565</p>
                            <p>[10:30:50] [Server thread/INFO]: Done (2.5s)! For help, type "help"</p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Server className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum servidor encontrado</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Suas configurações do Aternos são sincronizadas automaticamente
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label>Sincronização</Label>
              <Button variant="outline" className="w-full">
                <Loader2 className="w-4 h-4 mr-2" />
                Sincronizar Agora
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
