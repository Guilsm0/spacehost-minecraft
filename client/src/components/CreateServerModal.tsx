import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CreateServerModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateServerModal({ open, onClose }: CreateServerModalProps) {
  const utils = trpc.useUtils();
  
  const [formData, setFormData] = useState({
    name: "",
    version: "1.20.1",
    software: "vanilla" as const,
    slots: 20,
    difficulty: "normal" as const,
    gamemode: "survival" as const,
    worldType: "default",
    pvpEnabled: true,
    whitelistEnabled: false,
    crackedEnabled: false,
    commandBlocksEnabled: false,
    netherEnabled: true,
    animalsEnabled: true,
    monstersEnabled: true,
    spawnProtection: 16,
    forceGamemode: false,
  });

  const createServerMutation = trpc.servers.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Servidor "${data.name}" criado com sucesso!`);
      toast.info(`Endereço: ${data.address}:${data.port}`);
      utils.servers.list.invalidate();
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      version: "1.20.1",
      software: "vanilla",
      slots: 20,
      difficulty: "normal",
      gamemode: "survival",
      worldType: "default",
      pvpEnabled: true,
      whitelistEnabled: false,
      crackedEnabled: false,
      commandBlocksEnabled: false,
      netherEnabled: true,
      animalsEnabled: true,
      monstersEnabled: true,
      spawnProtection: 16,
      forceGamemode: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Nome do servidor é obrigatório");
      return;
    }
    
    if (formData.name.length < 3) {
      toast.error("Nome do servidor deve ter pelo menos 3 caracteres");
      return;
    }

    createServerMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle>Criar Novo Servidor</DialogTitle>
          <DialogDescription>
            Configure seu servidor Minecraft. Todas as configurações podem ser alteradas depois.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Configurações Básicas</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Servidor *</Label>
              <Input
                id="name"
                placeholder="Meu Servidor Incrível"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="software">Software</Label>
                <Select
                  value={formData.software}
                  onValueChange={(value: any) => setFormData({ ...formData, software: value })}
                >
                  <SelectTrigger id="software">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vanilla">Vanilla</SelectItem>
                    <SelectItem value="spigot">Spigot</SelectItem>
                    <SelectItem value="paper">Paper</SelectItem>
                    <SelectItem value="forge">Forge</SelectItem>
                    <SelectItem value="fabric">Fabric</SelectItem>
                    <SelectItem value="bedrock">Bedrock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">Versão</Label>
                <Select
                  value={formData.version}
                  onValueChange={(value) => setFormData({ ...formData, version: value })}
                >
                  <SelectTrigger id="version">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1.20.1">1.20.1</SelectItem>
                    <SelectItem value="1.19.4">1.19.4</SelectItem>
                    <SelectItem value="1.18.2">1.18.2</SelectItem>
                    <SelectItem value="1.16.5">1.16.5</SelectItem>
                    <SelectItem value="1.12.2">1.12.2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slots">Slots (Jogadores Máximos)</Label>
                <Input
                  id="slots"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.slots}
                  onChange={(e) => setFormData({ ...formData, slots: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Dificuldade</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger id="difficulty">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gamemode">Modo de Jogo</Label>
                <Select
                  value={formData.gamemode}
                  onValueChange={(value: any) => setFormData({ ...formData, gamemode: value })}
                >
                  <SelectTrigger id="gamemode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="survival">Sobrevivência</SelectItem>
                    <SelectItem value="creative">Criativo</SelectItem>
                    <SelectItem value="adventure">Aventura</SelectItem>
                    <SelectItem value="spectator">Espectador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="worldType">Tipo de Mundo</Label>
                <Select
                  value={formData.worldType}
                  onValueChange={(value) => setFormData({ ...formData, worldType: value })}
                >
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
            </div>
          </div>

          {/* Game Rules */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Regras do Jogo</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="pvp">PVP</Label>
                <Switch
                  id="pvp"
                  checked={formData.pvpEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, pvpEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="whitelist">Whitelist</Label>
                <Switch
                  id="whitelist"
                  checked={formData.whitelistEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, whitelistEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="cracked">Cracked (Pirata)</Label>
                <Switch
                  id="cracked"
                  checked={formData.crackedEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, crackedEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="commandBlocks">Command Blocks</Label>
                <Switch
                  id="commandBlocks"
                  checked={formData.commandBlocksEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, commandBlocksEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="nether">Nether</Label>
                <Switch
                  id="nether"
                  checked={formData.netherEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, netherEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="animals">Animais</Label>
                <Switch
                  id="animals"
                  checked={formData.animalsEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, animalsEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="monsters">Monstros</Label>
                <Switch
                  id="monsters"
                  checked={formData.monstersEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, monstersEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="forceGamemode">Forçar Gamemode</Label>
                <Switch
                  id="forceGamemode"
                  checked={formData.forceGamemode}
                  onCheckedChange={(checked) => setFormData({ ...formData, forceGamemode: checked })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="spawnProtection">Proteção de Spawn (blocos)</Label>
              <Input
                id="spawnProtection"
                type="number"
                min="0"
                max="999"
                value={formData.spawnProtection}
                onChange={(e) => setFormData({ ...formData, spawnProtection: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={createServerMutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createServerMutation.isPending}>
              {createServerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Servidor"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
