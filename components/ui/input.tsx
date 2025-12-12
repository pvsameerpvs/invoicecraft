"use client";

import * as React from "react";
import { cn } from "../utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
