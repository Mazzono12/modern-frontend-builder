import { Construction } from "lucide-react";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="space-y-1 mb-6">
        <h2 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="glass rounded-xl p-16 text-center bg-gradient-mesh relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="relative">
          <div className="size-14 rounded-2xl bg-gradient-primary grid place-items-center mx-auto mb-4 shadow-glow">
            <Construction className="size-6 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-display font-medium">Módulo em construção</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Esta tela faz parte do redesign completo da plataforma FIFHER. Estamos priorizando os módulos com maior
            impacto primeiro.
          </p>
        </div>
      </div>
    </div>
  );
}
