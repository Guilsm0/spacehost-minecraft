import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, HardDrive, Cpu, Users, Clock } from "lucide-react";

interface OverviewTabProps {
  server: any; // Using any to avoid import issues
}

export default function OverviewTab({ server }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Connection Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Conexão</CardTitle>
          <CardDescription>Use estas informações para conectar ao servidor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Endereço do Servidor</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 bg-muted px-3 py-2 rounded-md font-mono text-sm">
                  {server.address}
                </code>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Porta</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 bg-muted px-3 py-2 rounded-md font-mono text-sm">
                  {server.port}
                </code>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Software</label>
              <p className="mt-1 font-medium capitalize">{server.software}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Versão</label>
              <p className="mt-1 font-medium">{server.version}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Jogadores</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 / {server.slots}</div>
            <p className="text-xs text-muted-foreground mt-1">Online agora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">RAM</CardTitle>
              <Cpu className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{server.ramUsed} MB</div>
            <p className="text-xs text-muted-foreground mt-1">de {server.ramTotal} MB</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Armazenamento</CardTitle>
              <HardDrive className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(Number(server.storageUsed) / 1024)} GB</div>
            <p className="text-xs text-muted-foreground mt-1">de {Math.round(Number(server.storageTotal) / 1024)} GB</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {server.status === 'online' ? '00:00:00' : '--:--:--'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Tempo online</p>
          </CardContent>
        </Card>
      </div>

      {/* Server Settings Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Servidor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Dificuldade</label>
              <p className="mt-1 font-medium capitalize">{server.difficulty}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Modo de Jogo</label>
              <p className="mt-1 font-medium capitalize">{server.gamemode}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Tipo de Mundo</label>
              <p className="mt-1 font-medium capitalize">{server.worldType}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">PVP</label>
              <p className="mt-1 font-medium">{server.pvpEnabled ? 'Ativado' : 'Desativado'}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Whitelist</label>
              <p className="mt-1 font-medium">{server.whitelistEnabled ? 'Ativada' : 'Desativada'}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Command Blocks</label>
              <p className="mt-1 font-medium">{server.commandBlocksEnabled ? 'Ativados' : 'Desativados'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
