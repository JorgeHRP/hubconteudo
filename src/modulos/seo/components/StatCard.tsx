import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  delay?: number;
  subtitleColor?: string;
}

const difficultyColors: Record<string, string> = {
  LOW: "text-success",
  MEDIUM: "text-warning-strong",
  HIGH: "text-destructive",
};

const StatCard = ({ title, value, subtitle, icon: Icon, trend, subtitleColor }: StatCardProps) => {
  const resolvedColor = subtitleColor || (subtitle && difficultyColors[subtitle]) || "";

  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="mt-1.5 break-words font-display text-2xl font-semibold leading-none">{value}</p>
          {subtitle && <p className={`mt-1.5 text-xs font-medium ${resolvedColor || "text-muted-foreground"}`}>{subtitle}</p>}
          {trend && (
            <p className={`mt-1.5 text-xs font-medium ${trend.positive ? "text-success" : "text-destructive"}`}>
              {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}% vs mês anterior
            </p>
          )}
        </div>
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
};

export default StatCard;


