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
  LOW: "text-emerald-500",
  MEDIUM: "text-amber-500",
  HIGH: "text-red-500",
};

const StatCard = ({ title, value, subtitle, icon: Icon, trend, delay = 0, subtitleColor }: StatCardProps) => {
  const delayClass = delay === 0 ? "animate-fade-in-up" : delay === 1 ? "animate-fade-in-up-delay-1" : delay === 2 ? "animate-fade-in-up-delay-2" : "animate-fade-in-up-delay-3";
  const resolvedColor = subtitleColor || (subtitle && difficultyColors[subtitle]) || "";

  return (
    <div className={`glass-card-hover p-6 ${delayClass}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{title}</p>
          <p className="stat-value mt-1">{value}</p>
          {subtitle && <p className={`text-xs font-semibold mt-1 ${resolvedColor || "text-muted-foreground"}`}>{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-medium mt-2 ${trend.positive ? "text-emerald-600" : "text-red-500"}`}>
              {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}% vs mês anterior
            </p>
          )}
        </div>
        <div className="p-3 rounded-xl" style={{ background: "var(--gradient-accent)" }}>
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;


