import React from 'react';
import { cn } from '@/lib/utils';

type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  centered?: boolean;
};

export function LoadingSpinner({ 
  size = "md", 
  className = "",
  centered = false
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  const wrapperClasses = centered ? "flex justify-center items-center" : "";

  return (
    <div className={wrapperClasses}>
      <div className={cn(
        "animate-spin rounded-full border-t-transparent border-primary", 
        sizeClasses[size],
        className
      )}></div>
    </div>
  );
}