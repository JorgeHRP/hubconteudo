import { toast as sonner } from "sonner";

/**
 * Adaptador: o módulo de SEO veio usando o `use-toast` do shadcn, e a Central
 * Interna usa sonner. Isto traduz a chamada, evitando trazer um segundo sistema
 * de notificação para dentro do projeto.
 */
interface ToastEntrada {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function toast({ title, description, variant }: ToastEntrada) {
  const texto = title ?? description ?? "";
  const opcoes = title && description ? { description } : undefined;
  if (variant === "destructive") return sonner.error(texto, opcoes);
  return sonner.success(texto, opcoes);
}

export function useToast() {
  return { toast };
}
