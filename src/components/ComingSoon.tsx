import { Construction } from "lucide-react";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="space-y-1 mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="surface-card p-16 text-center bg-gradient-mesh">
        <div className="size-12 rounded-xl bg-primary/15 grid place-items-center mx-auto mb-4">
          <Construction className="size-6 text-primary" />
        </div>
        <h3 className="text-lg font-medium">Módulo em construção</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Esta tela faz parte do redesign completo da plataforma Whatomate. Estamos priorizando os módulos com maior impacto primeiro.
        </p>
      </div>
    </div>
  );
}
