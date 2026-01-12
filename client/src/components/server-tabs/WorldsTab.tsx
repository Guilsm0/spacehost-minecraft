import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Upload, Download } from "lucide-react";

interface WorldsTabProps {
  serverId: number;
}

export default function WorldsTab({ serverId }: WorldsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mundos</CardTitle>
        <CardDescription>Faça upload e download de mundos do servidor (limite 1GB)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button className="flex-1" variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Upload de Mundo
          </Button>
          <Button className="flex-1" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download do Mundo Atual
          </Button>
        </div>
        <div className="text-center text-muted-foreground py-8">
          <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Funcionalidade de gerenciamento de mundos em breve</p>
        </div>
      </CardContent>
    </Card>
  );
}
