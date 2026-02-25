export default function ProtocoloDetalhesPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">
        Protocolo {params.id}
      </h1>
      <p className="text-muted-foreground">
        Detalhes do protocolo SAGI. Em construção.
      </p>
    </div>
  );
}
