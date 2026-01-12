import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Loader2, Server, Users, Zap, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ServerInfo {
  address: string;
  port: number;
  version: string;
  motd: string;
  maxPlayers: number;
  onlinePlayers: number;
  latency: number;
}

export default function ServerDiscovery() {
  const [address, setAddress] = useState("");
  const [port, setPort] = useState("25565");
  const [isSearching, setIsSearching] = useState(false);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address.trim()) {
      toast.error("Digite um endereço ou IP");
      return;
    }

    setIsSearching(true);
    setError(null);
    setServerInfo(null);

    try {
      // Simular busca de servidor
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock data
      setServerInfo({
        address: address.trim(),
        port: parseInt(port),
        version: "1.20.1",
        motd: "§6Bem-vindo ao nosso servidor Minecraft!",
        maxPlayers: 20,
        onlinePlayers: 5,
        latency: Math.floor(Math.random() * 100) + 10,
      });
      
      toast.success("Servidor encontrado!");
    } catch (err) {
      setError("Não foi possível localizar o servidor. Verifique o endereço e tente novamente.");
      toast.error("Erro ao buscar servidor");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Search className="w-4 h-4 mr-2" />
          Descobrir Servidor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Descobrir Servidor Minecraft</DialogTitle>
          <DialogDescription>
            Localize e obtenha informações de um servidor Minecraft externo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Endereço ou IP</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="play.example.com ou 192.168.1.1"
              disabled={isSearching}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="port">Porta</Label>
            <Input
              id="port"
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="25565"
              min="1"
              max="65535"
              disabled={isSearching}
            />
          </div>

          <Button type="submit" disabled={isSearching} className="w-full">
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Buscar Servidor
              </>
            )}
          </Button>
        </form>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-2">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {serverInfo && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Informações do Servidor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Endereço</span>
                <span className="font-medium">{serverInfo.address}:{serverInfo.port}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Versão</span>
                <span className="font-medium">{serverInfo.version}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Jogadores</span>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="font-medium">{serverInfo.onlinePlayers}/{serverInfo.maxPlayers}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Latência</span>
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-green-500" />
                  <span className="font-medium">{serverInfo.latency}ms</span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-1">MOTD</p>
                <p className="text-sm font-medium">{serverInfo.motd.replace(/§./g, "")}</p>
              </div>

              <Button className="w-full mt-4">
                <Server className="w-4 h-4 mr-2" />
                Conectar a este Servidor
              </Button>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}
