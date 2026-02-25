export default function ProtocoloInternoDetalhesPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">
        Protocolo Interno {params.id}
      </h1>
      <p className="text-muted-foreground">
        Detalhes do protocolo interno GED. Em construção.
      </p>
    </div>
  );
}
