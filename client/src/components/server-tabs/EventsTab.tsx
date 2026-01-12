import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Activity } from "lucide-react";

interface EventsTabProps {
  serverId: number;
}

export default function EventsTab({ serverId }: EventsTabProps) {
  const { data: events, isLoading } = trpc.events.list.useQuery({ serverId });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Eventos do Servidor</CardTitle>
        <CardDescription>Histórico de eventos e ações no servidor</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : events && events.length > 0 ? (
          <div className="space-y-2">
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Activity className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{event.message}</p>
                  <p className="text-sm text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">Nenhum evento registrado</p>
        )}
      </CardContent>
    </Card>
  );
}
