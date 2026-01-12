import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, FileText } from "lucide-react";

interface FilesTabProps {
  serverId: number;
}

export default function FilesTab({ serverId }: FilesTabProps) {
  const { data: files, isLoading } = trpc.files.list.useQuery({ serverId });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Arquivos do Servidor</CardTitle>
        <CardDescription>Gerencie arquivos, plugins e configurações</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : files && files.length > 0 ? (
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{file.fileName}</p>
                  <p className="text-sm text-muted-foreground">{(Number(file.fileSize) / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">Nenhum arquivo enviado</p>
        )}
      </CardContent>
    </Card>
  );
}
