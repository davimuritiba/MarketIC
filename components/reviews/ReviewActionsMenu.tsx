"use client";

import { useEffect, useRef, useState } from "react";

import { MoreVertical } from "lucide-react";

type ReviewActionsMenuProps = {
  canEdit: boolean;
  canDelete: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
};

export function ReviewActionsMenu({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  disabled = false,
}: ReviewActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!containerRef.current || !target) {
        return;
      }
      if (!containerRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  if (!canEdit && !canDelete) {
    return null;
  }

  const handleEdit = () => {
    setOpen(false);
    onEdit?.();
  };

  const handleDelete = () => {
    setOpen(false);
    onDelete?.();
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="rounded-full p-1 text-neutral-500 hover:text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
      >
        <MoreVertical className="h-4 w-4" />
        <span className="sr-only">Ações da avaliação</span>
      </button>
      {open ? (
        <div className="absolute right-0 z-10 mt-2 w-44 overflow-hidden rounded-md border border-neutral-200 bg-white shadow-lg">
          <ul className="py-1 text-sm text-neutral-700">
            {canEdit ? (
              <li>
                <button
                  type="button"
                  className="flex w-full items-center px-3 py-2 text-left hover:bg-neutral-100 cursor-pointer"
                  onClick={handleEdit}
                >
                  Editar avaliação
                </button>
              </li>
            ) : null}
            {canDelete ? (
              <li>
                <button
                  type="button"
                  className="flex w-full items-center px-3 py-2 text-left text-red-600 hover:bg-red-50 cursor-pointer"
                  onClick={handleDelete}
                >
                  Excluir avaliação
                </button>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
