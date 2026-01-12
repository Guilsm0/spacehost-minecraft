import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, Plus, Loader2, Globe, Trash2 } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

interface WorldsTabEnhancedProps {
  serverId: number;
}

export default function WorldsTabEnhanced({ serverId }: WorldsTabEnhancedProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [worldName, setWorldName] = useState("");
  const [worldSeed, setWorldSeed] = useState("");
  const [worldType, setWorldType] = useState("default");
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock worlds data
  const [worlds] = useState([
    {
      id: 1,
      name: "world",
      size: 125000000,
      created: new Date(),
      lastModified: new Date(),
      difficulty: "normal",
      worldType: "default",
    },
  ]);

  const handleCreateWorld = (e: React.FormEvent) => {
    e.preventDefault();
    if (!worldName.trim()) {
      toast.error("Nome do mundo é obrigatório");
      return;
    }

    setIsCreating(true);
    setTimeout(() => {
      toast.success(`Mundo "${worldName}" criado com sucesso!`);
      setWorldName("");
      setWorldSeed("");
      setWorldType("default");
      setShowCreateForm(false);
      setIsCreating(false);
    }, 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máximo 1GB)");
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      toast.success(`Mundo "${file.name}" enviado com sucesso!`);
      setIsUploading(false);
    }, 2000);
  };

  const handleDownloadWorld = (worldName: string) => {
    toast.success(`Download de "${worldName}" iniciado!`);
    // Simular download
    const url = `https://storage.spacehost.cloud/worlds/server-${serverId}/${worldName}.zip`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Create World Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Criar Novo Mundo</CardTitle>
              <CardDescription>Gere um novo mundo Minecraft para seu servidor</CardDescription>
            </div>
            <Button
              variant={showCreateForm ? "destructive" : "default"}
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? "Cancelar" : <Plus className="w-4 h-4 mr-2" />}
              {showCreateForm ? "Cancelar" : "Criar Mundo"}
            </Button>
          </div>
        </CardHeader>
        {showCreateForm && (
          <CardContent>
            <form onSubmit={handleCreateWorld} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="worldName">Nome do Mundo</Label>
                  <Input
                    id="worldName"
                    value={worldName}
                    onChange={(e) => setWorldName(e.target.value)}
                    placeholder="world, survival, etc"
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="worldSeed">Seed (Opcional)</Label>
                  <Input
                    id="worldSeed"
                    value={worldSeed}
                    onChange={(e) => setWorldSeed(e.target.value)}
                    placeholder="Deixe em branco para aleatório"
                    disabled={isCreating}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="worldType">Tipo de Mundo</Label>
                <Select value={worldType} onValueChange={setWorldType}>
                  <SelectTrigger id="worldType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Padrão</SelectItem>
                    <SelectItem value="flat">Plano</SelectItem>
                    <SelectItem value="large_biomes">Biomas Grandes</SelectItem>
                    <SelectItem value="amplified">Amplificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={isCreating} className="w-full">
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando mundo...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Mundo
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Upload/Download Section */}
      <Card>
        <CardHeader>
          <CardTitle>Importar/Exportar Mundos</CardTitle>
          <CardDescription>Upload de mundo (.zip até 1GB) ou download do mundo atual</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload de Mundo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,.rar,.7z"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleDownloadWorld("world")}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Mundo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Worlds List */}
      <Card>
        <CardHeader>
          <CardTitle>Mundos do Servidor</CardTitle>
        </CardHeader>
        <CardContent>
          {worlds && worlds.length > 0 ? (
            <div className="space-y-2">
              {worlds.map((world: any) => (
                <div key={world.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{world.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(world.size / 1024 / 1024).toFixed(2)} MB • {world.worldType}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadWorld(world.name)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum mundo criado. Crie um novo mundo para começar!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
