"use client";

import * as React from "react";
import { cn } from "../utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, type = "button", variant = "default", size = "default", ...props }, ref) => {
    
    // Variant styles
    const variants = {
      default: "bg-brand-primary text-white hover:bg-brand-end shadow-md hover:shadow-brand-primary/30",
      destructive: "bg-red-500 text-slate-50 hover:bg-red-500/90",
      outline: "border border-brand-primary/30 bg-white hover:bg-brand-50 hover:text-brand-primary text-slate-700",
      secondary: "bg-brand-50 text-brand-primary hover:bg-brand-100",
      ghost: "hover:bg-brand-50 hover:text-brand-primary",
      link: "text-brand-primary underline-offset-4 hover:underline",
    };

    // Size styles
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    };

    return (
      <button
        type={type}
        ref={ref}
        className={cn(
            // Base styles
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
