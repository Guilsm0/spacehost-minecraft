import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  Server, ArrowLeft, Play, Square, RotateCw, Loader2,
  Terminal, Users, FolderOpen, Archive, Globe, Puzzle, 
  Shield, Calendar, Settings as SettingsIcon
} from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";
import OverviewTab from "@/components/server-tabs/OverviewTab";
import ConsoleTab from "@/components/server-tabs/ConsoleTab";
import PlayersTab from "@/components/server-tabs/PlayersTab";
import FilesTab from "@/components/server-tabs/FilesTab";
import BackupsTab from "@/components/server-tabs/BackupsTab";
import WorldsTab from "@/components/server-tabs/WorldsTab";
import AddonsTab from "@/components/server-tabs/AddonsTab";
import EventsTab from "@/components/server-tabs/EventsTab";
import OptionsTab from "@/components/server-tabs/OptionsTab";

export default function ServerManagement() {
  const { id } = useParams<{ id: string }>();
  const serverId = parseInt(id || "0");
  const [, setLocation] = useLocation();
  
  const utils = trpc.useUtils();
  const { data: server, isLoading } = trpc.servers.get.useQuery({ serverId });
  
  const startServerMutation = trpc.servers.start.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.servers.get.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const stopServerMutation = trpc.servers.stop.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.servers.get.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const restartServerMutation = trpc.servers.restart.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.servers.get.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!server) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-16 text-center">
            <Server className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Servidor não encontrado</h3>
            <p className="text-muted-foreground mb-6">
              O servidor que você está procurando não existe ou foi excluído.
            </p>
            <Link href="/dashboard">
              <Button>Voltar ao Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-lg bg-card/30 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
              </Link>
              
              <div className="flex items-center gap-3">
                <Server className="w-6 h-6 text-primary" />
                <div>
                  <h1 className="text-xl font-bold">{server.name}</h1>
                  <p className="text-sm text-muted-foreground">{server.address}</p>
                </div>
              </div>
              
              <Badge className={getStatusClass(server.status)}>
                {getStatusLabel(server.status)}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {server.status === 'offline' ? (
                <Button
                  onClick={() => startServerMutation.mutate({ serverId })}
                  disabled={startServerMutation.isPending}
                  className="gap-2"
                >
                  {startServerMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Iniciar
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => restartServerMutation.mutate({ serverId })}
                    disabled={restartServerMutation.isPending || server.status !== 'online'}
                    className="gap-2"
                  >
                    {restartServerMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCw className="w-4 h-4" />
                    )}
                    Reiniciar
                  </Button>
                  
                  <Button
                    variant="destructive"
                    onClick={() => stopServerMutation.mutate({ serverId })}
                    disabled={stopServerMutation.isPending || server.status === 'stopping'}
                    className="gap-2"
                  >
                    {stopServerMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    Parar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-9 w-full">
            <TabsTrigger value="overview" className="gap-2">
              <Server className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="console" className="gap-2">
              <Terminal className="w-4 h-4" />
              <span className="hidden sm:inline">Console</span>
            </TabsTrigger>
            <TabsTrigger value="players" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Players</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Files</span>
            </TabsTrigger>
            <TabsTrigger value="backups" className="gap-2">
              <Archive className="w-4 h-4" />
              <span className="hidden sm:inline">Backups</span>
            </TabsTrigger>
            <TabsTrigger value="worlds" className="gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Worlds</span>
            </TabsTrigger>
            <TabsTrigger value="addons" className="gap-2">
              <Puzzle className="w-4 h-4" />
              <span className="hidden sm:inline">Addons</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Events</span>
            </TabsTrigger>
            <TabsTrigger value="options" className="gap-2">
              <SettingsIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Options</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab server={server} />
          </TabsContent>

          <TabsContent value="console">
            <ConsoleTab serverId={serverId} serverStatus={server.status} />
          </TabsContent>

          <TabsContent value="players">
            <PlayersTab serverId={serverId} />
          </TabsContent>

          <TabsContent value="files">
            <FilesTab serverId={serverId} />
          </TabsContent>

          <TabsContent value="backups">
            <BackupsTab serverId={serverId} />
          </TabsContent>

          <TabsContent value="worlds">
            <WorldsTab serverId={serverId} />
          </TabsContent>

          <TabsContent value="addons">
            <AddonsTab serverId={serverId} software={server.software} version={server.version} />
          </TabsContent>

          <TabsContent value="events">
            <EventsTab serverId={serverId} />
          </TabsContent>

          <TabsContent value="options">
            <OptionsTab server={server} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'online':
      return 'bg-success/20 text-success border-success/30';
    case 'starting':
      return 'bg-warning/20 text-warning border-warning/30';
    case 'stopping':
      return 'bg-warning/20 text-warning border-warning/30';
    case 'crashed':
      return 'bg-destructive/20 text-destructive border-destructive/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'online':
      return 'Online';
    case 'starting':
      return 'Iniciando';
    case 'stopping':
      return 'Parando';
    case 'crashed':
      return 'Erro';
    default:
      return 'Offline';
  }
}
