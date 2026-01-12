import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Search, Loader2, Star, Users, Package, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Addon {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  downloads: number;
  rating: number;
  compatible: string[];
}

export default function AddonInstaller({ serverId }: { serverId: number }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Addon[]>([]);
  const [installedAddons, setInstalledAddons] = useState<Addon[]>([
    {
      id: "1",
      name: "EssentialsX",
      description: "Plugin essencial com comandos úteis",
      version: "2.20.0",
      author: "EssentialsX Team",
      downloads: 5000000,
      rating: 4.8,
      compatible: ["1.20.1", "1.20", "1.19"],
    },
  ]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast.error("Digite um termo de busca");
      return;
    }

    setIsSearching(true);

    try {
      // Simular busca
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock results
      setSearchResults([
        {
          id: "2",
          name: "LiteBans",
          description: "Sistema avançado de banimentos",
          version: "3.5.0",
          author: "Lathanael",
          downloads: 2000000,
          rating: 4.7,
          compatible: ["1.20.1", "1.20", "1.19"],
        },
        {
          id: "3",
          name: "WorldEdit",
          description: "Ferramenta de edição de mundo",
          version: "7.2.14",
          author: "sk89q",
          downloads: 3000000,
          rating: 4.9,
          compatible: ["1.20.1", "1.20", "1.19"],
        },
      ]);
      
      toast.success("Busca concluída!");
    } catch (error) {
      toast.error("Erro ao buscar plugins");
    } finally {
      setIsSearching(false);
    }
  };

  const handleInstall = (addon: Addon) => {
    setInstalledAddons([...installedAddons, addon]);
    setSearchResults(searchResults.filter(a => a.id !== addon.id));
    toast.success(`${addon.name} instalado com sucesso!`);
  };

  const handleUninstall = (addon: Addon) => {
    setInstalledAddons(installedAddons.filter(a => a.id !== addon.id));
    toast.success(`${addon.name} desinstalado!`);
  };

  const renderAddonCard = (addon: Addon, isInstalled: boolean = false) => (
    <div key={addon.id} className="p-4 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold">{addon.name}</h4>
          <p className="text-sm text-muted-foreground">{addon.author}</p>
        </div>
        <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded">
          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
          <span className="text-sm font-medium">{addon.rating}</span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-3">{addon.description}</p>

      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {(addon.downloads / 1000000).toFixed(1)}M downloads
        </div>
        <div className="flex items-center gap-1">
          <Package className="w-3 h-3" />
          v{addon.version}
        </div>
      </div>

      <div className="flex gap-2">
        {isInstalled ? (
          <Button
            size="sm"
            variant="destructive"
            className="flex-1"
            onClick={() => handleUninstall(addon)}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Desinstalar
          </Button>
        ) : (
          <Button
            size="sm"
            className="flex-1"
            onClick={() => handleInstall(addon)}
          >
            <Download className="w-4 h-4 mr-1" />
            Instalar
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciador de Plugins/Mods</CardTitle>
        <CardDescription>Busque e instale plugins do CurseForge e Modrinth</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Buscar</TabsTrigger>
            <TabsTrigger value="installed">Instalados ({installedAddons.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar plugins ou mods..."
                disabled={isSearching}
              />
              <Button type="submit" disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </form>

            {searchResults.length > 0 && (
              <div className="grid gap-3">
                {searchResults.map(addon => renderAddonCard(addon, false))}
              </div>
            )}

            {searchResults.length === 0 && !isSearching && searchQuery && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum resultado encontrado para "{searchQuery}"</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="installed" className="space-y-3">
            {installedAddons.length > 0 ? (
              <div className="grid gap-3">
                {installedAddons.map(addon => renderAddonCard(addon, true))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum plugin/mod instalado</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
