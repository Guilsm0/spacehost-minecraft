import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Loader2, UserCheck, Shield, Ban } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PlayersTabProps {
  serverId: number;
}

export default function PlayersTab({ serverId }: PlayersTabProps) {
  const [newPlayerName, setNewPlayerName] = useState("");
  
  const utils = trpc.useUtils();
  const { data: players, isLoading } = trpc.players.list.useQuery({ serverId });
  
  const addPlayerMutation = trpc.players.add.useMutation({
    onSuccess: () => {
      toast.success("Jogador adicionado");
      setNewPlayerName("");
      utils.players.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const updatePlayerMutation = trpc.players.update.useMutation({
    onSuccess: () => {
      toast.success("Jogador atualizado");
      utils.players.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Jogador</CardTitle>
          <CardDescription>Adicione jogadores à whitelist ou como operadores</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!newPlayerName.trim()) return;
            addPlayerMutation.mutate({ serverId, username: newPlayerName.trim() });
          }} className="flex gap-2">
            <Input
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Nome do jogador"
              disabled={addPlayerMutation.isPending}
            />
            <Button type="submit" disabled={addPlayerMutation.isPending || !newPlayerName.trim()}>
              {addPlayerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Jogadores</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : players && players.length > 0 ? (
            <div className="space-y-2">
              {players.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{player.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {player.lastSeen ? `Visto: ${new Date(player.lastSeen).toLocaleDateString()}` : 'Nunca entrou'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {player.isBanned && <Badge variant="destructive">Banido</Badge>}
                    {player.isOperator && <Badge className="bg-accent">OP</Badge>}
                    {player.isWhitelisted && <Badge>Whitelist</Badge>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhum jogador cadastrado</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
