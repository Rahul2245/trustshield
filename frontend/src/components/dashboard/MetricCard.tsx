import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  accent: "green" | "blue" | "pink" | "red";
  href?: string;
}

const accentStyles = {
  green: "bg-green-50 text-green-600",
  blue: "bg-blue-50 text-blue-600",
  pink: "bg-pink-50 text-pink-600",
  red: "bg-red-50 text-red-600",
};

export function MetricCard({
  title,
  value,
  trend,
  trendLabel,
  accent,
  href,
}: MetricCardProps) {
  const content = (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl",
              accentStyles[accent]
            )}
          >
            <div className="h-3 w-3 rounded-full bg-current opacity-60" />
          </div>
          {href && (
            <ArrowUpRight className="h-5 w-5 text-muted" />
          )}
        </div>
        <p className="mt-4 text-sm text-muted">{title}</p>
        <p className="mt-1 text-4xl font-bold tracking-tight text-primary">
          {value}
        </p>
        {trend !== undefined && (
          <div className="mt-3 flex items-center gap-1 text-sm">
            {trend >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={trend >= 0 ? "text-green-600" : "text-red-600"}>
              {Math.abs(trend)}%
            </span>
            {trendLabel && <span className="text-muted">{trendLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
}
