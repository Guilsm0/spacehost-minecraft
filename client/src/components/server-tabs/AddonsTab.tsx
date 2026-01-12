import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Puzzle } from "lucide-react";

interface AddonsTabProps {
  serverId: number;
  software: string;
  version: string;
}

export default function AddonsTab({ serverId, software, version }: AddonsTabProps) {
  const { data: addons, isLoading } = trpc.addons.list.useQuery({ serverId });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plugins & Mods</CardTitle>
        <CardDescription>Instale plugins e mods do CurseForge e Modrinth</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : addons && addons.length > 0 ? (
          <div className="space-y-2">
            {addons.map((addon) => (
              <div key={addon.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Puzzle className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{addon.name}</p>
                  <p className="text-sm text-muted-foreground">{addon.version} • {addon.author}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <Puzzle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum plugin ou mod instalado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
