"use client";

import * as React from "react";
import { cn } from "../utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, type = "button", ...props }, ref) => {
    return (
      <button
        type={type}
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
