"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { MoreVertical } from "lucide-react"

import { AdGridPager, type AdItem } from "@/components/AdCard"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog"

interface ProfileAdGridPagerProps {
  items: AdItem[]
  maxPerPage: number
  gridClass: string
}

export function ProfileAdGridPager({
  items,
  maxPerPage,
  gridClass,
}: ProfileAdGridPagerProps) {
  const router = useRouter()
  const [localItems, setLocalItems] = useState(items)
  const [deleteTarget, setDeleteTarget] = useState<AdItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    setLocalItems(items)
  }, [items])

  const handleEdit = (item: AdItem) => {
    router.push(`/anunciar/${item.id}/editar`)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    try {
      setIsDeleting(true)
      setDeleteError(null)
      const response = await fetch(`/api/items/${deleteTarget.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        let message = "Não foi possível excluir o anúncio."
        try {
          const data = await response.json()
          if (typeof data?.error === "string" && data.error.trim()) {
            message = data.error
          }
        } catch (error) {
          const text = await response.text()
          if (text.trim()) {
            message = text
          }
        }
        throw new Error(message)
      }

      setLocalItems((prev) => prev.filter((item) => item.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o anúncio.",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const renderActions = (item: AdItem) => (
    <AdCardActionMenu
      onEdit={() => handleEdit(item)}
      onDelete={() => {
        setDeleteError(null)
        setDeleteTarget(item)
      }}
    />
  )

  return (
    <>
      <AdGridPager
        items={localItems}
        maxPerPage={maxPerPage}
        gridClass={gridClass}
        renderActions={renderActions}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteError(null)
            setDeleteTarget(null)
          }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              Você tem certeza que deseja excluir este anúncio?
            </DialogTitle>
            <DialogDescription>
              A exclusão remove permanentemente todas as informações.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="text-sm text-red-500">{deleteError}</p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => {
                if (!isDeleting) {
                  setDeleteError(null)
                  setDeleteTarget(null)
                }
              }}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="cursor-pointer"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface AdCardActionMenuProps {
  onEdit: () => void
  onDelete: () => void
}

function AdCardActionMenu({ onEdit, onDelete }: AdCardActionMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    const handleClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full border bg-white text-muted-foreground shadow-sm transition hover:bg-muted cursor-pointer"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setOpen((prev) => !prev)
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="h-4 w-4" />
        <span className="sr-only">Abrir menu de ações do anúncio</span>
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-md border bg-white py-1 text-sm shadow-lg">
          <button
            type="button"
            className="block w-full px-3 py-2 text-left transition hover:bg-muted cursor-pointer"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setOpen(false)
              onEdit()
            }}
          >
            Editar anúncio
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-red-600 transition hover:bg-red-50 cursor-pointer"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setOpen(false)
              onDelete()
            }}
          >
            Excluir anúncio
          </button>
        </div>
      ) : null}
    </div>
  )
}
