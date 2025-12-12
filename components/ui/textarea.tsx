"use client";

import * as React from "react";
import { cn } from "../utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
