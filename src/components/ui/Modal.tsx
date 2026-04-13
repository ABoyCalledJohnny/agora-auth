"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/src/lib/utils.ts";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    const clickedInside =
      e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (!clickedInside) {
      dialog.close();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="modal-title"
      onClose={onClose}
      onClick={handleBackdropClick}
      className={cn(
        "m-auto w-full max-w-md -translate-y-15 rounded-lg border border-neutral-200 bg-white p-6 shadow-lg backdrop:bg-black/40 backdrop:backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex flex-col gap-3">
        <h2 id="modal-title" className="text-lg text-neutral-800">
          {title}
        </h2>

        <div className="text-sm text-neutral-600">{children}</div>
      </div>
    </dialog>
  );
}
