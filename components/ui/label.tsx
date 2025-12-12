import * as React from "react";
import { cn } from "../utils";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "mb-1 block text-[11px] font-medium text-slate-700",
        className
      )}
      {...props}
    />
  );
}
