import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Plus, Loader2, Download, Archive } from "lucide-react";
import { toast } from "sonner";

interface BackupsTabProps {
  serverId: number;
}

export default function BackupsTab({ serverId }: BackupsTabProps) {
  const utils = trpc.useUtils();
  const { data: backups, isLoading } = trpc.backups.list.useQuery({ serverId });
  
  const createBackupMutation = trpc.backups.create.useMutation({
    onSuccess: () => {
      toast.success("Backup iniciado");
      utils.backups.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Backups</CardTitle>
              <CardDescription>Crie e gerencie backups do seu servidor</CardDescription>
            </div>
            <Button onClick={() => createBackupMutation.mutate({ serverId, name: `Backup ${new Date().toLocaleString()}` })} disabled={createBackupMutation.isPending}>
              {createBackupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Criar Backup
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : backups && backups.length > 0 ? (
            <div className="space-y-2">
              {backups.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Archive className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{backup.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(backup.createdAt).toLocaleString()} • {(Number(backup.size) / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhum backup criado</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
