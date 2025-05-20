import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

// Grafiklerde kullanılacak standart renkler
export const CHART_COLORS = [
  "#3b82f6", // primary blue
  "#16a34a", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#f97316", // orange
];

interface AreaChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  gradientColor?: string;
  height?: number;
  formatter?: (value: number) => string;
}

export function DashboardAreaChart({
  data,
  xKey,
  yKey,
  gradientColor = "#3b82f6",
  height = 350,
  formatter,
}: AreaChartProps) {
  if (!data || data.length === 0) {
    return <Skeleton className="w-full h-[350px]" />;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`gradient-${yKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={gradientColor} stopOpacity={0.8} />
            <stop offset="95%" stopColor={gradientColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey={xKey} />
        <YAxis />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip formatter={formatter} />
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={gradientColor}
          fillOpacity={1}
          fill={`url(#gradient-${yKey})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface BarChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  barColor?: string;
  height?: number;
  formatter?: (value: number) => string;
  vertical?: boolean;
}

export function DashboardBarChart({
  data,
  xKey,
  yKey,
  barColor = "#3b82f6",
  height = 350,
  formatter,
  vertical = false,
}: BarChartProps) {
  if (!data || data.length === 0) {
    return <Skeleton className="w-full h-[350px]" />;
  }

  if (vertical) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical">
          <XAxis type="number" />
          <YAxis dataKey={xKey} type="category" width={80} />
          <Tooltip formatter={formatter} />
          <Bar dataKey={yKey} fill={barColor} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip formatter={formatter} />
        <CartesianGrid strokeDasharray="3 3" />
        <Bar dataKey={yKey} fill={barColor} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface PieChartProps {
  data: any[];
  dataKey: string;
  nameKey: string;
  colors?: string[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  formatter?: (value: number) => string;
  showLabel?: boolean;
  labelFormatter?: (entry: any) => string;
}

export function DashboardPieChart({
  data,
  dataKey,
  nameKey,
  colors = CHART_COLORS,
  height = 300,
  innerRadius = 60,
  outerRadius = 80,
  formatter,
  showLabel = true,
  labelFormatter,
}: PieChartProps) {
  if (!data || data.length === 0) {
    return <Skeleton className="w-full h-[300px]" />;
  }

  const renderLabel = showLabel
    ? (entry: any) => {
        if (labelFormatter) {
          return labelFormatter(entry);
        }
        return `${entry.name}: ${entry.percent * 100}%`;
      }
    : undefined;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={showLabel}
          label={renderLabel}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          fill="#8884d8"
          paddingAngle={5}
          dataKey={dataKey}
          nameKey={nameKey}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip formatter={formatter} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface LineChartProps {
  data: any[];
  xKey: string;
  lines: {
    key: string;
    color: string;
    name?: string;
  }[];
  height?: number;
  formatter?: (value: number) => string;
}

export function DashboardLineChart({
  data,
  xKey,
  lines,
  height = 350,
  formatter,
}: LineChartProps) {
  if (!data || data.length === 0) {
    return <Skeleton className="w-full h-[350px]" />;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip formatter={formatter} />
        <Legend />
        {lines.map((line, index) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color}
            name={line.name || line.key}
            activeDot={{ r: 8 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}