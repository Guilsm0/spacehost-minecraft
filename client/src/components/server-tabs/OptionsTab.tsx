import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface OptionsTabProps {
  server: any; // Using any to avoid circular import issues
}

export default function OptionsTab({ server }: OptionsTabProps) {
  const utils = trpc.useUtils();
  const [formData, setFormData] = useState({
    slots: server.slots,
    difficulty: server.difficulty,
    gamemode: server.gamemode,
    pvpEnabled: server.pvpEnabled,
    whitelistEnabled: server.whitelistEnabled,
    crackedEnabled: server.crackedEnabled,
    commandBlocksEnabled: server.commandBlocksEnabled,
    netherEnabled: server.netherEnabled,
    animalsEnabled: server.animalsEnabled,
    monstersEnabled: server.monstersEnabled,
    spawnProtection: server.spawnProtection,
    forceGamemode: server.forceGamemode,
  });

  const updateServerMutation = trpc.servers.update.useMutation({
    onSuccess: () => {
      toast.success("Configurações atualizadas");
      utils.servers.get.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateServerMutation.mutate({ serverId: server.id, ...formData });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Servidor</CardTitle>
        <CardDescription>Altere as configurações do servidor (requer reinicialização)</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slots">Slots (Jogadores Máximos)</Label>
              <Input id="slots" type="number" min="1" max="100" value={formData.slots} onChange={(e) => setFormData({ ...formData, slots: parseInt(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Dificuldade</Label>
              <Select value={formData.difficulty} onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}>
                <SelectTrigger id="difficulty"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="peaceful">Pacífico</SelectItem>
                  <SelectItem value="easy">Fácil</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="hard">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Regras do Jogo</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="pvp">PVP</Label>
                <Switch id="pvp" checked={formData.pvpEnabled} onCheckedChange={(checked) => setFormData({ ...formData, pvpEnabled: checked })} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="whitelist">Whitelist</Label>
                <Switch id="whitelist" checked={formData.whitelistEnabled} onCheckedChange={(checked) => setFormData({ ...formData, whitelistEnabled: checked })} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="cracked">Cracked</Label>
                <Switch id="cracked" checked={formData.crackedEnabled} onCheckedChange={(checked) => setFormData({ ...formData, crackedEnabled: checked })} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="commandBlocks">Command Blocks</Label>
                <Switch id="commandBlocks" checked={formData.commandBlocksEnabled} onCheckedChange={(checked) => setFormData({ ...formData, commandBlocksEnabled: checked })} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="nether">Nether</Label>
                <Switch id="nether" checked={formData.netherEnabled} onCheckedChange={(checked) => setFormData({ ...formData, netherEnabled: checked })} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="animals">Animais</Label>
                <Switch id="animals" checked={formData.animalsEnabled} onCheckedChange={(checked) => setFormData({ ...formData, animalsEnabled: checked })} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="monsters">Monstros</Label>
                <Switch id="monsters" checked={formData.monstersEnabled} onCheckedChange={(checked) => setFormData({ ...formData, monstersEnabled: checked })} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="forceGamemode">Forçar Gamemode</Label>
                <Switch id="forceGamemode" checked={formData.forceGamemode} onCheckedChange={(checked) => setFormData({ ...formData, forceGamemode: checked })} />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={updateServerMutation.isPending}>
            {updateServerMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : "Salvar Configurações"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
