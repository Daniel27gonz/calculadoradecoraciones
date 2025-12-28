import * as React from "react";
import { cn } from "@/lib/utils";

interface NumericFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  prefix?: string;
  suffix?: string;
  containerClassName?: string;
}

const NumericField = React.forwardRef<HTMLInputElement, NumericFieldProps>(
  ({ className, label, prefix, suffix, containerClassName, ...props }, ref) => {
    return (
      <div className={cn("space-y-1.5", containerClassName)}>
        {label && (
          <label className="text-xs font-medium text-muted-foreground leading-none">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3 text-sm text-muted-foreground pointer-events-none">
              {prefix}
            </span>
          )}
          <input
            type="number"
            inputMode="decimal"
            className={cn(
              "flex h-11 w-full rounded-lg border border-input bg-background text-base font-medium transition-all duration-200",
              "ring-offset-background placeholder:text-muted-foreground/60",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:border-primary",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "tabular-nums text-right",
              "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
              prefix ? "pl-8 pr-3" : "px-3",
              suffix ? "pr-10" : "pr-3",
              className
            )}
            ref={ref}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 text-sm text-muted-foreground pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
      </div>
    );
  }
);
NumericField.displayName = "NumericField";

export { NumericField };
