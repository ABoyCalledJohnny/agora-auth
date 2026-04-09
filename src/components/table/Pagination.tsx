"use client";

import { Button } from "@/src/components/ui/Button.tsx";
import { cn } from "@/src/lib/utils.ts";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  labels: {
    previous: string;
    next: string;
    pageOf: string;
  };
  className?: string;
};

export function Pagination({ page, totalPages, onPageChange, labels, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-between px-4 py-3", className)}>
      <Button
        variant="secondary"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="px-3 py-1.5 text-xs"
      >
        {labels.previous}
      </Button>

      <span className="text-sm text-neutral-500">{labels.pageOf}</span>

      <Button
        variant="secondary"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="px-3 py-1.5 text-xs"
      >
        {labels.next}
      </Button>
    </nav>
  );
}
