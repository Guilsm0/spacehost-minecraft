import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Send, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

interface ConsoleTabProps {
  serverId: number;
  serverStatus: string;
}

export default function ConsoleTab({ serverId, serverStatus }: ConsoleTabProps) {
  const [command, setCommand] = useState("");
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  const { data: logs, isLoading } = trpc.console.getLogs.useQuery({ serverId });
  
  const executeCommandMutation = trpc.console.executeCommand.useMutation({
    onSuccess: () => {
      setCommand("");
      toast.success("Comando executado");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    
    executeCommandMutation.mutate({
      serverId,
      command: command.trim(),
    });
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Console do Servidor</CardTitle>
        <CardDescription>
          Execute comandos e visualize logs em tempo real
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Logs Display */}
        <div className="bg-black/50 rounded-lg p-4 h-[500px] overflow-y-auto font-mono text-sm custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="space-y-1">
              {logs.map((log) => (
                <div key={log.id} className={`text-${getLogColor(log.logLevel)}`}>
                  <span className="text-muted-foreground">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>{" "}
                  {log.message}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Nenhum log disponível. Inicie o servidor para ver os logs.
            </div>
          )}
        </div>

        {/* Command Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder={serverStatus === 'online' ? "Digite um comando..." : "Servidor deve estar online"}
            disabled={serverStatus !== 'online' || executeCommandMutation.isPending}
            className="font-mono"
          />
          <Button
            type="submit"
            disabled={serverStatus !== 'online' || !command.trim() || executeCommandMutation.isPending}
          >
            {executeCommandMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function getLogColor(level: string): string {
  switch (level) {
    case 'error':
      return 'red-400';
    case 'warning':
      return 'yellow-400';
    case 'debug':
      return 'gray-400';
    default:
      return 'green-400';
  }
}
