"use client";

import { cn } from "@/lib/utils";
import { LoadingScreen } from "./loading-screen";

interface LoadingOverlayProps {
  isOpen: boolean;
  message?: string;
  className?: string;
  overlayClassName?: string;
}

export function LoadingOverlay({ isOpen, message, className, overlayClassName, }: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm transition-opacity duration-300",
        overlayClassName, isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0" )}
      role="status"
      aria-live="polite"
      aria-hidden={!isOpen}
    >
      <div className={cn("px-6 py-8 rounded-3xl bg-white/80 shadow-lg", className)}>
        <LoadingScreen message={message} />
      </div>
    </div>
  );
}