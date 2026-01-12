import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Server, Plus, Play, Square, Settings, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import CreateServerModal from "@/components/CreateServerModal";
import { toast } from "sonner";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const utils = trpc.useUtils();
  const { data: servers, isLoading } = trpc.servers.list.useQuery();
  
  const startServerMutation = trpc.servers.start.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.servers.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const stopServerMutation = trpc.servers.stop.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.servers.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const deleteServerMutation = trpc.servers.delete.useMutation({
    onSuccess: () => {
      toast.success("Servidor excluído com sucesso");
      utils.servers.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleStartServer = (serverId: number) => {
    startServerMutation.mutate({ serverId });
  };

  const handleStopServer = (serverId: number) => {
    stopServerMutation.mutate({ serverId });
  };

  const handleDeleteServer = (serverId: number, serverName: string) => {
    if (confirm(`Tem certeza que deseja excluir o servidor "${serverName}"? Esta ação não pode ser desfeita.`)) {
      deleteServerMutation.mutate({ serverId });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-lg bg-card/30 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer">
                <Server className="w-8 h-8 text-primary" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  SpaceHost
                </h1>
              </div>
            </Link>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user?.name || user?.email}
              </span>
              <Button
                variant="outline"
                onClick={() => {
                  trpc.auth.logout.useMutation().mutate();
                  setLocation("/");
                }}
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Meus Servidores</h2>
            <p className="text-muted-foreground">
              Gerencie seus servidores Minecraft ({servers?.length || 0}/5)
            </p>
          </div>
          
          <Button
            size="lg"
            onClick={() => setShowCreateModal(true)}
            disabled={servers && servers.length >= 5}
            className="gap-2"
          >
            <Plus className="w-5 h-5" />
            Criar Servidor
          </Button>
        </div>

        {/* Servers Grid */}
        {servers && servers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servers.map((server) => (
              <Card key={server.id} className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/30 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-xl">{server.name}</CardTitle>
                    <Badge className={getStatusClass(server.status)}>
                      {getStatusLabel(server.status)}
                    </Badge>
                  </div>
                  <CardDescription>
                    {server.address}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Software:</span>
                      <span className="font-medium capitalize">{server.software}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Versão:</span>
                      <span className="font-medium">{server.version}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Jogadores:</span>
                      <span className="font-medium">0/{server.slots}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">RAM:</span>
                      <span className="font-medium">{server.ramUsed}MB / {server.ramTotal}MB</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {server.status === 'offline' ? (
                      <Button
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => handleStartServer(server.id)}
                        disabled={startServerMutation.isPending}
                      >
                        {startServerMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        Iniciar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 gap-2"
                        onClick={() => handleStopServer(server.id)}
                        disabled={stopServerMutation.isPending || server.status === 'stopping'}
                      >
                        {stopServerMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                        Parar
                      </Button>
                    )}
                    
                    <Link href={`/server/${server.id}`}>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Settings className="w-4 h-4" />
                        Gerenciar
                      </Button>
                    </Link>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteServer(server.id, server.name)}
                      disabled={deleteServerMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="py-16 text-center">
              <Server className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Nenhum servidor criado</h3>
              <p className="text-muted-foreground mb-6">
                Crie seu primeiro servidor Minecraft para começar
              </p>
              <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                <Plus className="w-5 h-5" />
                Criar Primeiro Servidor
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Create Server Modal */}
      <CreateServerModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
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
