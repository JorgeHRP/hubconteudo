import type { ReactNode } from "react";
import { Check, GraduationCap, ListChecks, Users } from "lucide-react";

/**
 * Moldura das telas de entrada (login e criação de senha): formulário à
 * esquerda e, do tablet largo para cima, um painel escuro com a prévia
 * ilustrada da Central. A prévia é desenho, sem dado real.
 */
export function TelaDeEntrada({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-3 sm:p-6">
      <div className="grid w-full max-w-[1120px] overflow-hidden rounded-2xl border bg-card shadow-pop lg:min-h-[660px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:p-3">
        {/* Linha de assinatura: só aparece quando o painel escuro some (celular). */}
        <div className="assinatura-marca h-1 lg:hidden" aria-hidden />

        <div className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-14">
          <div className="mx-auto w-full max-w-sm">{children}</div>
        </div>

        <PainelVitrine />
      </div>
    </div>
  );
}

const barras = [38, 52, 44, 66, 58, 74, 62, 86, 78, 96];

function PainelVitrine() {
  return (
    <aside
      aria-hidden
      className="dark relative hidden overflow-hidden rounded-xl bg-background text-foreground lg:flex lg:flex-col"
    >
      {/* Fundo: brilho em ciano, brilho em azul da marca e uma malha fina. */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 animate-brilho rounded-full bg-[#22d3f2]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#1746a2]/40 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at 60% 40%, black 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 60% 40%, black 20%, transparent 75%)",
        }}
      />

      <div className="relative px-10 pt-10">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground/80">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Central Interna
        </p>
        <h2 className="mt-5 max-w-md text-[2rem] font-semibold leading-[1.15] text-white">
          O dia a dia da agência,{" "}
          <span className="text-primary">num lugar só.</span>
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Clientes, tarefas, treinamentos e documentos do time, organizados para você
          encontrar rápido e seguir em frente.
        </p>
      </div>

      {/* Prévia ilustrada da Central. */}
      <div className="relative mt-8 flex-1">
        <div className="absolute left-10 right-[-56px] top-0 animate-flutuar">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-card shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
            <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
              <span className="h-2 w-2 rounded-full bg-white/20" />
              <span className="h-2 w-2 rounded-full bg-white/20" />
              <span className="h-2 w-2 rounded-full bg-white/20" />
              <span className="ml-3 h-4 w-40 rounded bg-white/5" />
            </div>
            <div className="flex">
              <div className="w-12 shrink-0 space-y-2.5 border-r border-white/10 px-3 py-4">
                <span className="block h-5 w-5 rounded bg-primary/90" />
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="block h-5 w-5 rounded bg-white/[0.07]" />
                ))}
              </div>
              <div className="min-w-0 flex-1 p-4">
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { icone: Users, rotulo: "Clientes ativos", valor: "42" },
                    { icone: ListChecks, rotulo: "Tarefas da semana", valor: "128" },
                    { icone: GraduationCap, rotulo: "Trilhas concluídas", valor: "17" },
                  ].map(({ icone: Icone, rotulo, valor }) => (
                    <div key={rotulo} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="truncate text-[11px]">{rotulo}</span>
                        <Icone className="h-3.5 w-3.5 shrink-0 text-primary" />
                      </div>
                      <p className="mt-1.5 font-display text-xl font-semibold text-white">{valor}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-2.5 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Entregas por semana</span>
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
                      em alta
                    </span>
                  </div>
                  <div className="mt-3 flex h-24 items-end gap-2">
                    {barras.map((altura, i) => (
                      <span
                        key={i}
                        className="flex-1 origin-bottom animate-crescer rounded-t bg-gradient-to-t from-[#1746a2] to-[#22d3f2]"
                        style={{ height: `${altura}%`, animationDelay: `${150 + i * 60}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cartão solto por cima, para dar profundidade. */}
        <div className="absolute bottom-10 left-6 animate-flutuar-lento">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-popover/95 px-4 py-3 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)] backdrop-blur">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success/15 text-success">
              <Check className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-semibold text-white">Onboarding concluído</p>
              <p className="text-[11px] text-muted-foreground">Tudo certo para começar</p>
            </div>
          </div>
        </div>
      </div>

      <div className="assinatura-marca relative h-1" />
    </aside>
  );
}
