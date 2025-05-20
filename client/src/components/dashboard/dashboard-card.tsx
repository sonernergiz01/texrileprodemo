import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
  isLoading?: boolean;
}

export function DashboardCard({
  title,
  value,
  description,
  icon,
  trend,
  isLoading = false,
}: DashboardCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-24 mb-1" />
            {trend && <Skeleton className="h-4 w-36" />}
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            {trend && (
              <p className="text-xs text-muted-foreground">
                <span className={trend.isPositive ? "text-green-500" : "text-red-500"}>
                  {trend.isPositive ? "+" : "-"}
                  {trend.value}
                </span>{" "}
                {description}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function DashboardChartCard({
  title,
  description,
  children,
  isLoading = false,
  className = "",
}: DashboardChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="w-full h-[300px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardStatsCardProps {
  title: string;
  description?: string;
  stats: {
    label: string;
    value: string | number;
    color?: string;
  }[];
  isLoading?: boolean;
}

export function DashboardStatsCard({
  title,
  description,
  stats,
  isLoading = false,
}: DashboardStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
          </div>
        ) : (
          <div className="space-y-4">
            {stats.map((stat, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm">{stat.label}:</span>
                <span className={`font-medium ${stat.color || ""}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardEmptySectionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function DashboardEmptySection({
  icon,
  title,
  description,
}: DashboardEmptySectionProps) {
  return (
    <div className="h-[400px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-center">
        {icon}
        <h3 className="text-2xl font-bold">{title}</h3>
        <p className="text-muted-foreground max-w-md">{description}</p>
      </div>
    </div>
  );
}