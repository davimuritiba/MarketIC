"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { MoreVertical } from "lucide-react"

import { AdGridPager } from "@/components/AdCard"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog"

import type { ProfileAdItem } from "@/types/profile"

interface ProfileAdGridPagerProps {
  items: ProfileAdItem[]
  maxPerPage: number
  gridClass: string
  showStatusActions?: boolean
  onItemDelete?: (itemId: string) => void
  onItemStatusChange?: (item: ProfileAdItem) => void
}

export function ProfileAdGridPager({
  items,
  maxPerPage,
  gridClass,
  showStatusActions = false,
  onItemDelete,
  onItemStatusChange,
}: ProfileAdGridPagerProps) {
  const router = useRouter()
  const [localItems, setLocalItems] = useState(items)
  const [deleteTarget, setDeleteTarget] = useState<ProfileAdItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [statusTarget, setStatusTarget] = useState<
    | { item: ProfileAdItem; status: "INATIVO" | "FINALIZADO" }
    | null
  >(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)

  useEffect(() => {
    setLocalItems(items)
  }, [items])

  const handleEdit = (item: ProfileAdItem) => {
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
      onItemDelete?.(deleteTarget.id)
      setDeleteTarget(null)
      router.refresh()
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

  const handleConfirmStatusChange = async () => {
    if (!statusTarget) return

    try {
      setIsUpdatingStatus(true)
      setStatusError(null)
      const response = await fetch(`/api/items/${statusTarget.item.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: statusTarget.status }),
      })

      if (!response.ok) {
        let message = "Não foi possível atualizar o status do anúncio."
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

      const updatedItem = (await response.json()) as ProfileAdItem
      setLocalItems((prev) =>
        prev.filter((item) => item.id !== statusTarget.item.id),
      )
      onItemStatusChange?.(updatedItem)
      setStatusTarget(null)
      router.refresh()
    } catch (error) {
      setStatusError(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o status do anúncio.",
      )
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const renderActions = (item: ProfileAdItem) => (
    <AdCardActionMenu
      item={item}
      showStatusActions={showStatusActions}
      onEdit={() => handleEdit(item)}
      onDelete={() => {
        setDeleteError(null)
        setDeleteTarget(item)
      }}
      onFinalize={() => {
        setStatusError(null)
        setStatusTarget({ item, status: "FINALIZADO" })
      }}
      onDeactivate={() => {
        setStatusError(null)
        setStatusTarget({ item, status: "INATIVO" })
      }}
    />
  )

  return (
    <>
      <AdGridPager
        items={localItems}
        maxPerPage={maxPerPage}
        gridClass={gridClass}
        renderActions={(item) => renderActions(item as ProfileAdItem)}
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

      <Dialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => {
          if (!open && !isUpdatingStatus) {
            setStatusError(null)
            setStatusTarget(null)
          }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              {statusTarget?.status === "FINALIZADO"
                ? "Finalizar anúncio"
                : "Inativar anúncio"}
            </DialogTitle>
            <DialogDescription>
              {statusTarget?.status === "FINALIZADO"
                ? "Ao finalizar, o anúncio será marcado como concluído e ficará disponível apenas no histórico."
                : "Ao inativar, o anúncio deixará de ser exibido nas listas de ativos até que seja reativado."}
            </DialogDescription>
          </DialogHeader>
          {statusError && (
            <p className="text-sm text-red-500">{statusError}</p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => {
                if (!isUpdatingStatus) {
                  setStatusError(null)
                  setStatusTarget(null)
                }
              }}
              disabled={isUpdatingStatus}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-[#1500FF] hover:bg-[#1200d6] cursor-pointer"
              onClick={handleConfirmStatusChange}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus
                ? "Atualizando..."
                : statusTarget?.status === "FINALIZADO"
                ? "Finalizar"
                : "Inativar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface AdCardActionMenuProps {
  item: ProfileAdItem
  showStatusActions: boolean
  onEdit: () => void
  onDelete: () => void
  onFinalize: () => void
  onDeactivate: () => void
}

function AdCardActionMenu({
  item,
  showStatusActions,
  onEdit,
  onDelete,
  onFinalize,
  onDeactivate,
}: AdCardActionMenuProps) {
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
          {showStatusActions && item.statusCode === "PUBLICADO" ? (
            <>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left transition hover:bg-muted cursor-pointer"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setOpen(false)
                  onDeactivate()
                }}
              >
                Inativar anúncio
              </button>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left transition hover:bg-muted cursor-pointer"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setOpen(false)
                  onFinalize()
                }}
              >
                Finalizar anúncio
              </button>
              <div className="my-1 h-px bg-neutral-200" />
            </>
          ) : null}
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
