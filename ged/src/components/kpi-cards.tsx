import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { protocols } from '@/lib/data';
import { FileText, FileX, Files } from 'lucide-react';

export function KpiCards() {
  const totalProtocols = protocols.length;
  const protocolsWithoutDocs = protocols.filter(
    (p) => p.documentCount === 0
  ).length;
  const totalDocuments = protocols.reduce(
    (acc, p) => acc + p.documentCount,
    0
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Protocolos no Setor
          </CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProtocols}</div>
          <p className="text-xs text-muted-foreground">
            +2.1% do último mês
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Protocolos Sem Docs
          </CardTitle>
          <FileX className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{protocolsWithoutDocs}</div>
          <p className="text-xs text-muted-foreground">
            -5 desde o último mês
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Documentos</CardTitle>
          <Files className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDocuments}</div>
          <p className="text-xs text-muted-foreground">
            +180.1% do último mês
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
