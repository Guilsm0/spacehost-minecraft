import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Plus, Loader2, Download, Archive, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface BackupsTabProps {
  serverId: number;
}

export default function BackupsTabImproved({ serverId }: BackupsTabProps) {
  const utils = trpc.useUtils();
  const [deleteBackupId, setDeleteBackupId] = useState<number | null>(null);

  const { data: backups, isLoading } = trpc.backups.list.useQuery({ serverId });
  const { data: worlds } = trpc.worlds.list.useQuery({ serverId });

  const createBackupMutation = trpc.backups.create.useMutation({
    onSuccess: () => {
      toast.success("Backup iniciado");
      utils.backups.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteBackupMutation = trpc.backups.delete.useMutation({
    onSuccess: () => {
      toast.success("Backup deletado com sucesso");
      utils.backups.list.invalidate();
      setDeleteBackupId(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Concluído";
      case "in_progress":
        return "Em Progresso";
      case "failed":
        return "Falhou";
      case "pending":
        return "Pendente";
      default:
        return status;
    }
  };

  // Separate world backups from server backups
  const worldBackups = worlds?.filter(w => w.isBackup) || [];
  const serverBackups = backups || [];

  return (
    <div className="space-y-6">
      {/* Create Backup Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Criar Backup</CardTitle>
              <CardDescription>Faça backup manual do seu servidor</CardDescription>
            </div>
            <Button
              onClick={() =>
                createBackupMutation.mutate({
                  serverId,
                  name: `Backup ${new Date().toLocaleString()}`,
                })
              }
              disabled={createBackupMutation.isPending}
            >
              {createBackupMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Criar Backup Agora
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* World Backups Section */}
      {worldBackups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Backups de Mundos</CardTitle>
            <CardDescription>
              Clones de mundos salvos ({worldBackups.length} backup{worldBackups.length !== 1 ? "s" : ""})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {worldBackups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Copy className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-sm">{backup.name}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(backup.createdAt).toLocaleString()} • {formatBytes(Number(backup.size))}
                      </p>
                      {backup.backupOf && (
                        <p className="text-xs text-gray-500 mt-1">
                          Backup do mundo ID: {backup.backupOf}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4" />
                    </Button>

                    <AlertDialog open={deleteBackupId === backup.id}>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteBackupId(backup.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deletar Backup?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja deletar este backup? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex gap-2 justify-end">
                          <AlertDialogCancel onClick={() => setDeleteBackupId(null)}>
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              deleteBackupMutation.mutate({ backupId: backup.id });
                            }}
                            className="bg-destructive"
                          >
                            Deletar
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Server Backups Section */}
      <Card>
        <CardHeader>
          <CardTitle>Backups do Servidor</CardTitle>
          <CardDescription>
            {serverBackups.length} backup{serverBackups.length !== 1 ? "s" : ""} disponível{serverBackups.length !== 1 ? "is" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : serverBackups && serverBackups.length > 0 ? (
            <div className="space-y-2">
              {serverBackups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Archive className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{backup.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(
                            backup.status
                          )}`}
                        >
                          {getStatusLabel(backup.status)}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {new Date(backup.createdAt).toLocaleString()} • {formatBytes(Number(backup.size))} MB
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {backup.status === "completed" && (
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4" />
                      </Button>
                    )}

                    <AlertDialog open={deleteBackupId === backup.id}>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteBackupId(backup.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deletar Backup?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja deletar "{backup.name}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex gap-2 justify-end">
                          <AlertDialogCancel onClick={() => setDeleteBackupId(null)}>
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              deleteBackupMutation.mutate({ backupId: backup.id });
                            }}
                            className="bg-destructive"
                          >
                            Deletar
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Archive className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum backup criado</p>
              <p className="text-sm mt-2">Clique em "Criar Backup Agora" para começar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
