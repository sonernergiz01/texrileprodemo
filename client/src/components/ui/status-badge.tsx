import { cn, getStatusBgColor } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  code?: string;
  className?: string;
}

export const StatusBadge = ({ status, code, className }: StatusBadgeProps) => {
  const statusClass = code ? getStatusBgColor(code) : '';
  
  return (
    <span className={cn(
      "px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full",
      statusClass,
      className
    )}>
      {status}
    </span>
  );
};
