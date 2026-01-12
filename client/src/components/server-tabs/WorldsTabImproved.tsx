import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Globe,
  Upload,
  Download,
  Plus,
  Loader2,
  Trash2,
  Copy,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WorldsTabProps {
  serverId: number;
}

export default function WorldsTabImproved({ serverId }: WorldsTabProps) {
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [deleteWorldId, setDeleteWorldId] = useState<number | null>(null);
  const [backupWorldId, setBackupWorldId] = useState<number | null>(null);
  const [backupName, setBackupName] = useState("");

  const { data: worlds, isLoading } = trpc.worlds.list.useQuery({ serverId });
  const { data: activeWorld } = trpc.worlds.getActive.useQuery({ serverId });

  const generateMutation = trpc.worlds.generate.useMutation({
    onSuccess: () => {
      toast.success("Mundo gerado com sucesso!");
      utils.worlds.list.invalidate();
      utils.worlds.getActive.invalidate();
      setIsGenerating(false);
    },
    onError: (error) => {
      toast.error(`Erro ao gerar mundo: ${error.message}`);
      setIsGenerating(false);
    },
  });

  const uploadMutation = trpc.worlds.upload.useMutation({
    onSuccess: () => {
      toast.success("Mundo importado com sucesso!");
      utils.worlds.list.invalidate();
      utils.worlds.getActive.invalidate();
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (error) => {
      toast.error(`Erro ao importar mundo: ${error.message}`);
      setIsUploading(false);
    },
  });

  const downloadMutation = trpc.worlds.download.useQuery(
    { worldId: activeWorld?.id || 0 },
    { enabled: false }
  );

  const backupMutation = trpc.worlds.backup.useMutation({
    onSuccess: () => {
      toast.success("Backup criado com sucesso!");
      utils.worlds.list.invalidate();
      setIsBackingUp(false);
      setBackupWorldId(null);
      setBackupName("");
    },
    onError: (error) => {
      toast.error(`Erro ao criar backup: ${error.message}`);
      setIsBackingUp(false);
    },
  });

  const deleteMutation = trpc.worlds.delete.useMutation({
    onSuccess: () => {
      toast.success("Mundo deletado com sucesso!");
      utils.worlds.list.invalidate();
      setDeleteWorldId(null);
    },
    onError: (error) => {
      toast.error(`Erro ao deletar mundo: ${error.message}`);
    },
  });

  const handleGenerateWorld = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setIsGenerating(true);
    generateMutation.mutate({
      serverId,
      name: formData.get("name") as string,
      worldType: formData.get("worldType") as any,
      seed: formData.get("seed") as string,
      difficulty: formData.get("difficulty") as any,
      pvp: formData.get("pvp") === "on",
      spawnProtection: parseInt(formData.get("spawnProtection") as string),
      commandBlocks: formData.get("commandBlocks") === "on",
      netherEnabled: formData.get("netherEnabled") === "on",
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file extension
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "world" && ext !== "zip") {
      toast.error("Arquivo deve ser .world ou .zip");
      return;
    }

    setIsUploading(true);
    const buffer = await file.arrayBuffer();

    uploadMutation.mutate({
      serverId,
      fileName: file.name,
      fileData: new Uint8Array(buffer) as any,
    });
  };

  const handleDownloadWorld = async () => {
    if (!activeWorld) {
      toast.error("Nenhum mundo ativo para baixar");
      return;
    }

    try {
      const result = await downloadMutation.refetch();
      if (result.data?.downloadUrl) {
        window.open(result.data.downloadUrl, "_blank");
        toast.success("Download iniciado!");
      }
    } catch (error) {
      toast.error("Erro ao baixar mundo");
    }
  };

  const handleBackupWorld = (worldId: number) => {
    setBackupWorldId(worldId);
  };

  const confirmBackup = () => {
    if (!backupWorldId || !backupName.trim()) {
      toast.error("Nome do backup é obrigatório");
      return;
    }

    setIsBackingUp(true);
    backupMutation.mutate({
      worldId: backupWorldId,
      backupName: backupName.trim(),
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Generate World Section */}
      <Card>
        <CardHeader>
          <CardTitle>Gerar Novo Mundo</CardTitle>
          <CardDescription>
            Crie um novo mundo Minecraft com a API de geração
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Gerar Mundo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Gerar Novo Mundo</DialogTitle>
                <DialogDescription>
                  Configure os parâmetros do seu novo mundo Minecraft
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleGenerateWorld} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Mundo</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Meu Mundo"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="worldType">Tipo de Mundo</Label>
                    <Select name="worldType" defaultValue="default">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Normal</SelectItem>
                        <SelectItem value="flat">Flat</SelectItem>
                        <SelectItem value="large_biomes">
                          Biomas Grandes
                        </SelectItem>
                        <SelectItem value="amplified">Amplificado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="difficulty">Dificuldade</Label>
                    <Select name="difficulty" defaultValue="normal">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="peaceful">Pacífico</SelectItem>
                        <SelectItem value="easy">Fácil</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="hard">Difícil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="seed">Seed (Opcional)</Label>
                  <Input
                    id="seed"
                    name="seed"
                    placeholder="Deixe em branco para aleatório"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="pvp"
                      defaultChecked
                      className="rounded"
                    />
                    <span className="text-sm">Ativar PVP</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="commandBlocks"
                      className="rounded"
                    />
                    <span className="text-sm">Command Blocks</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="netherEnabled"
                      defaultChecked
                      className="rounded"
                    />
                    <span className="text-sm">Nether Habilitado</span>
                  </label>
                </div>

                <div>
                  <Label htmlFor="spawnProtection">Proteção de Spawn (blocos)</Label>
                  <Input
                    id="spawnProtection"
                    name="spawnProtection"
                    type="number"
                    defaultValue="16"
                    min="0"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    "Gerar Mundo"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Upload/Download Section */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Mundos</CardTitle>
          <CardDescription>
            Importe, exporte e faça backup de seus mundos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Mundo
                </>
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".world,.zip"
              onChange={handleFileUpload}
              className="hidden"
            />

            <Button
              variant="outline"
              onClick={handleDownloadWorld}
              disabled={!activeWorld}
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar Mundo
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Formatos aceitos:</p>
              <p>.world ou .zip (máximo 1GB)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Worlds List */}
      <Card>
        <CardHeader>
          <CardTitle>Mundos do Servidor</CardTitle>
          <CardDescription>
            {worlds?.length || 0} mundo(s) disponível(is)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : worlds && worlds.length > 0 ? (
            <div className="space-y-3">
              {worlds.map((world) => (
                <div
                  key={world.id}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    world.isActive
                      ? "border-green-500 bg-green-50"
                      : world.isBackup
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">{world.name}</h3>
                        {world.isActive && (
                          <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                            Ativo
                          </span>
                        )}
                        {world.isBackup && (
                          <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded">
                            Backup
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Tipo: {world.worldType} • Tamanho: {formatBytes(Number(world.size))}
                      </p>
                      {world.seed && (
                        <p className="text-xs text-gray-500 mt-1">
                          Seed: {world.seed}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Criado: {new Date(world.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {world.isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBackupWorld(world.id)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}

                      <AlertDialog open={deleteWorldId === world.id}>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteWorldId(world.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Deletar Mundo?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja deletar "{world.name}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="flex gap-2 justify-end">
                            <AlertDialogCancel onClick={() => setDeleteWorldId(null)}>
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                deleteMutation.mutate({ worldId: world.id });
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
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum mundo criado ainda</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Dialog */}
      <Dialog open={backupWorldId !== null} onOpenChange={(open) => {
        if (!open) {
          setBackupWorldId(null);
          setBackupName("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Backup do Mundo</DialogTitle>
            <DialogDescription>
              Dê um nome para identificar este backup
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="backupName">Nome do Backup</Label>
              <Input
                id="backupName"
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
                placeholder="Ex: Backup Antes da Atualização"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setBackupWorldId(null);
                  setBackupName("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmBackup}
                disabled={isBackingUp || !backupName.trim()}
              >
                {isBackingUp ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Backup"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
