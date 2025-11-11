"use client"

import type { FormEvent } from "react"
import { useEffect, useMemo, useState } from "react"

import { GraduationCap, Calendar, Star } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ReviewActionsMenu } from "@/components/reviews/ReviewActionsMenu"

import { resolveCourseLabel } from "@/lib/course-labels"
import type {
  PublicProfileUserData,
  UserReview,
} from "@/types/profile"

const REVIEW_PREVIEW_LIMIT = 3

function formatDate(value: string | null) {
  if (!value) return "Data de nascimento não informada"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Data de nascimento não informada"
  }
  date.setDate(date.getDate() + 1)
  return date.toLocaleDateString("pt-BR")
}

function getInitials(name?: string | null) {
  if (!name) return "US"
  const parts = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())

  const initials = parts.join("")
  if (initials) {
    return initials
  }

  return name.charAt(0).toUpperCase()
}

function formatReviewDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Data indisponível"
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

type PublicProfileCardProps = {
  user: PublicProfileUserData
  viewerCanReviewUser: boolean
  viewerHasReviewedUser: boolean
  reviews: UserReview[]
}

export default function PublicProfileCard({
  user,
  viewerCanReviewUser,
  viewerHasReviewedUser,
  reviews,
}: PublicProfileCardProps) {
  const courseLabel = user.curso
    ? resolveCourseLabel(user.curso) ?? user.curso
    : "Curso não informado"
  const [rating, setRating] = useState(user.reputacaoMedia ?? 0)
  const [ratingCount, setRatingCount] = useState(user.reputacaoCount ?? 0)
  const [canReview, setCanReview] = useState(viewerCanReviewUser)
  const [hasReviewed, setHasReviewed] = useState(viewerHasReviewedUser)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isReviewListOpen, setIsReviewListOpen] = useState(false)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [reviewTitle, setReviewTitle] = useState("")
  const [reviewComment, setReviewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [userReviews, setUserReviews] = useState<UserReview[]>(reviews)
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null)
  const [pendingReviewId, setPendingReviewId] = useState<string | null>(null)
  const [reviewToDelete, setReviewToDelete] = useState<UserReview | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    setUserReviews(reviews)
  }, [reviews])

  const previewReviews = useMemo(
    () => userReviews.slice(0, REVIEW_PREVIEW_LIMIT),
    [userReviews],
  )
  const hasMoreReviews = userReviews.length > REVIEW_PREVIEW_LIMIT
  const reviewStars = useMemo(() => Array.from({ length: 5 }), [])
  const isEditingReview = editingReviewId != null

  const parseReviewResponse = (raw: unknown): UserReview | null => {
    if (!raw || typeof raw !== "object") {
      return null
    }

    const review = raw as Record<string, unknown>
    const id = typeof review.id === "string" ? review.id : null
    const ratingValue =
      typeof review.rating === "number" ? review.rating : null
    const createdAt =
      typeof review.createdAt === "string" ? review.createdAt : null
    const reviewerRaw = review.reviewer

    if (!id || ratingValue == null || !createdAt || !reviewerRaw) {
      return null
    }

    if (typeof reviewerRaw !== "object") {
      return null
    }

    const reviewerRecord = reviewerRaw as Record<string, unknown>
    const reviewerId =
      typeof reviewerRecord.id === "string" ? reviewerRecord.id : null
    const reviewerName =
      typeof reviewerRecord.name === "string" ? reviewerRecord.name : null

    if (!reviewerId || !reviewerName) {
      return null
    }

    const canEdit = typeof review.canEdit === "boolean" ? review.canEdit : false
    const canDelete =
      typeof review.canDelete === "boolean" ? review.canDelete : false

    return {
      id,
      rating: ratingValue,
      title: typeof review.title === "string" ? review.title : null,
      comment: typeof review.comment === "string" ? review.comment : null,
      createdAt,
      reviewer: {
        id: reviewerId,
        name: reviewerName,
        avatarUrl:
          typeof reviewerRecord.avatarUrl === "string"
            ? reviewerRecord.avatarUrl
            : null,
      },
      canEdit,
      canDelete,
    }
  }

  const resetReviewForm = () => {
    setSelectedRating(null)
    setReviewTitle("")
    setReviewComment("")
    setEditingReviewId(null)
  }

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setErrorMessage(null)
      resetReviewForm()
    }
  }

  const handleDeleteDialogChange = (open: boolean) => {
    if (
      !open &&
      pendingReviewId != null &&
      reviewToDelete &&
      pendingReviewId === reviewToDelete.id
    ) {
      return
    }

    setIsDeleteDialogOpen(open)
    if (!open) {
      setReviewToDelete(null)
    }
  }

  const handleStartEditReview = (review: UserReview) => {
    if (!review.canEdit || pendingReviewId) {
      return
    }

    setSelectedRating(review.rating)
    setReviewTitle(review.title ?? "")
    setReviewComment(review.comment ?? "")
    setErrorMessage(null)
    setSuccessMessage(null)
    setEditingReviewId(review.id)
    setIsDialogOpen(true)
  }

  const handleRequestDeleteReview = (review: UserReview) => {
    if (!review.canDelete || pendingReviewId) {
      return
    }

    setReviewToDelete(review)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteReview = async () => {
    if (!reviewToDelete || !reviewToDelete.canDelete || pendingReviewId) {
      return
    }

    setPendingReviewId(reviewToDelete.id)
    setErrorMessage(null)

    try {
      const response = await fetch(
        `/api/users/${user.id}/reviews/${reviewToDelete.id}`,
        {
          method: "DELETE",
        },
      )

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        const message =
          payload && typeof payload.error === "string"
            ? payload.error
            : "Não foi possível excluir a avaliação."
        setErrorMessage(message)
        return
      }

      const updatedRating =
        payload && typeof payload.rating === "number"
          ? payload.rating
          : rating
      const updatedRatingCount =
        payload && typeof payload.ratingCount === "number"
          ? payload.ratingCount
          : ratingCount

      setRating(updatedRating)
      setRatingCount(updatedRatingCount)
      setUserReviews((previous) =>
        previous.filter((item) => item.id !== reviewToDelete.id),
      )
      setSuccessMessage("Avaliação excluída com sucesso.")
      setHasReviewed(false)
      setCanReview(true)
    } catch (error) {
      console.error("Erro ao excluir avaliação do usuário", error)
      setErrorMessage("Não foi possível excluir a avaliação.")
    } finally {
      setPendingReviewId(null)
      setIsDeleteDialogOpen(false)
      setReviewToDelete(null)
    }
  }

  const handleSubmitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (selectedRating == null) {
      setErrorMessage("Selecione uma nota entre 1 e 5.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const url = isEditingReview
        ? `/api/users/${user.id}/reviews/${editingReviewId}`
        : `/api/users/${user.id}/reviews`

      const response = await fetch(url, {
        method: isEditingReview ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: selectedRating,
          title: reviewTitle,
          comment: reviewComment,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        const message =
          payload && typeof payload.error === "string"
            ? payload.error
            : isEditingReview
              ? "Não foi possível atualizar a avaliação."
              : "Não foi possível registrar a avaliação."
        setErrorMessage(message)
        return
      }

      const updatedRating =
        payload && typeof payload.rating === "number"
          ? payload.rating
          : rating
      const updatedRatingCount =
        payload && typeof payload.ratingCount === "number"
          ? payload.ratingCount
          : ratingCount

      if (isEditingReview) {
        const updatedReview = parseReviewResponse(payload?.review)

        if (!updatedReview) {
          setErrorMessage("Resposta inesperada do servidor.")
          return
        }

        setRating(updatedRating)
        setRatingCount(updatedRatingCount)
        setCanReview(false)
        setHasReviewed(true)
        setUserReviews((previous) =>
          previous.map((item) =>
            item.id === updatedReview.id ? updatedReview : item,
          ),
        )
        setSuccessMessage("Avaliação atualizada com sucesso!")
      } else {
        const createdReview = parseReviewResponse(payload?.review)
        setRating(updatedRating)
        setRatingCount(updatedRatingCount)
        setCanReview(false)
        setHasReviewed(true)
        setSuccessMessage("Avaliação enviada com sucesso!")
        if (createdReview) {
          setUserReviews((previous) => [createdReview, ...previous])
        }
      }

      setIsDialogOpen(false)
      resetReviewForm()
    } catch (error) {
      console.error(
        isEditingReview
          ? "Erro ao atualizar avaliação do usuário"
          : "Erro ao registrar avaliação do usuário",
        error,
      )
      setErrorMessage(
        isEditingReview
          ? "Não foi possível atualizar a avaliação."
          : "Não foi possível registrar a avaliação.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col items-center space-y-4">
        <Avatar className="h-32 w-32 border-2 border-neutral-200 shadow-sm">
          <AvatarImage
            src={user.avatarUrl ?? undefined}
            alt={user.nome}
            className="object-cover"
          />
          <AvatarFallback className="text-2xl font-semibold uppercase bg-neutral-100 text-neutral-500">
            {getInitials(user.nome)}
          </AvatarFallback>
        </Avatar>
        <CardTitle className="text-lg text-center">{user.nome}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-neutral-800">
            Informações do usuário
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
              <GraduationCap className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-700">Curso</p>
              <p className="text-sm text-neutral-600">{courseLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
              <Calendar className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-700">
                Data de nascimento
              </p>
              <p className="text-sm text-neutral-600">
                {formatDate(user.dataNascimento)}
              </p>
            </div>
          </div>
        </section>
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-neutral-800">
            Classificação do usuário
          </h3>
          {ratingCount > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-500">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      size={20}
                      className={index < Math.round(rating) ? "fill-current" : ""}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {rating.toFixed(1)} de 5
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {ratingCount} avaliação{ratingCount > 1 ? "es" : ""}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Este usuário ainda não possui avaliações.
            </p>
          )}
          {successMessage ? (
            <p className="text-sm text-emerald-600">{successMessage}</p>
          ) : null}
          {canReview ? (
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => {
                resetReviewForm()
                setErrorMessage(null)
                setSuccessMessage(null)
                setIsDialogOpen(true)
              }}
            >
              Avaliar usuário
            </Button>
          ) : null}
          {!canReview && hasReviewed ? (
            <p className="text-sm text-muted-foreground">
              Você já avaliou este usuário.
            </p>
          ) : null}
        </section>
        <section className="space-y-4">
          {previewReviews.length ? (
            <div className="space-y-6">
              {previewReviews.map((review) => (
                <article key={review.id} className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={review.reviewer.avatarUrl ?? undefined}
                          alt={`Avatar de ${review.reviewer.name}`}
                        />
                        <AvatarFallback>
                          {getInitials(review.reviewer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-neutral-800">
                          {review.reviewer.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatReviewDate(review.createdAt)}
                        </p>
                      </div>
                    </div>
                    <ReviewActionsMenu
                      canEdit={review.canEdit}
                      canDelete={review.canDelete}
                      onEdit={() => handleStartEditReview(review)}
                      onDelete={() => handleRequestDeleteReview(review)}
                      disabled={isSubmitting || pendingReviewId === review.id}
                    />
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    {reviewStars.map((_, index) => (
                      <Star
                        key={index}
                        size={16}
                        className={
                          index < Math.round(review.rating)
                            ? "fill-current"
                            : ""
                        }
                      />
                    ))}
                  </div>
                  {review.title ? (
                    <h4 className="text-sm font-medium text-neutral-800">
                      {review.title}
                    </h4>
                  ) : null}
                  {review.comment ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {review.comment}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Este usuário ainda não possui avaliações com comentários.
            </p>
          )}
          {userReviews.length > 0 ? (
            <button
              type="button"
              onClick={() => setIsReviewListOpen(true)}
              className="text-sm font-medium text-[#1500FF] hover:underline cursor-pointer"
            >
              Ver todas as avaliações
            </button>
          ) : null}
          {hasMoreReviews ? (
            <p className="text-xs text-muted-foreground">
              Exibindo as {Math.min(REVIEW_PREVIEW_LIMIT, userReviews.length)}
              {" "}avaliações mais recentes.
            </p>
          ) : null}
        </section>
      </CardContent>
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {isEditingReview ? "Editar avaliação" : "Avaliar usuário"}
            </DialogTitle>
            <DialogDescription>
              {isEditingReview
                ? "Atualize as informações da sua avaliação."
                : "Compartilhe sua experiência com outros compradores."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Nota do usuário</p>
              <div className="flex gap-2 text-yellow-500">
                {Array.from({ length: 5 }).map((_, index) => {
                  const value = index + 1
                  const isActive =
                    selectedRating != null && value <= selectedRating

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedRating(value)}
                      className={`transition-colors ${
                        isActive ? "text-yellow-500" : "text-gray-300"
                      } cursor-pointer`}
                      aria-label={`Selecionar nota ${value}`}
                    >
                      <Star size={24} className={isActive ? "fill-current" : ""} />
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="user-review-title">
                Título (opcional)
              </label>
              <Input
                id="user-review-title"
                placeholder="Resumo da sua experiência"
                value={reviewTitle}
                onChange={(event) => setReviewTitle(event.target.value)}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                htmlFor="user-review-comment"
              >
                Comentário (opcional)
              </label>
              <Textarea
                id="user-review-comment"
                placeholder="Conte mais detalhes sobre sua negociação"
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                maxLength={1000}
                rows={4}
              />
            </div>
            {errorMessage ? (
              <p className="text-sm text-destructive">{errorMessage}</p>
            ) : null}
            <DialogFooter>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#1500FF] hover:bg-[#1200d6] cursor-pointer"
              >
                {isSubmitting
                  ? isEditingReview
                    ? "Salvando..."
                    : "Enviando..."
                  : isEditingReview
                    ? "Salvar alterações"
                    : "Enviar avaliação"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogChange}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Tem certeza que deseja excluir a avaliação?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => handleDeleteDialogChange(false)}
              disabled={
                pendingReviewId != null &&
                pendingReviewId === reviewToDelete?.id
              }
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="cursor-pointer"
              onClick={handleDeleteReview}
              disabled={
                reviewToDelete == null ||
                (pendingReviewId != null &&
                  pendingReviewId === reviewToDelete.id)
              }
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isReviewListOpen} onOpenChange={setIsReviewListOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Todas as avaliações</DialogTitle>
            <DialogDescription>
              Veja o que outros usuários comentaram sobre {user.nome}.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-6">
            {userReviews.length ? (
              userReviews.map((review) => (
                <article key={review.id} className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={review.reviewer.avatarUrl ?? undefined}
                          alt={`Avatar de ${review.reviewer.name}`}
                        />
                        <AvatarFallback>
                          {getInitials(review.reviewer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-neutral-800">
                          {review.reviewer.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatReviewDate(review.createdAt)}
                        </p>
                      </div>
                    </div>
                    <ReviewActionsMenu
                      canEdit={review.canEdit}
                      canDelete={review.canDelete}
                      onEdit={() => handleStartEditReview(review)}
                      onDelete={() => handleRequestDeleteReview(review)}
                      disabled={isSubmitting || pendingReviewId === review.id}
                    />
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    {reviewStars.map((_, index) => (
                      <Star
                        key={index}
                        size={16}
                        className={
                          index < Math.round(review.rating)
                            ? "fill-current"
                            : ""
                        }
                      />
                    ))}
                  </div>
                  {review.title ? (
                    <h4 className="text-sm font-medium text-neutral-800">
                      {review.title}
                    </h4>
                  ) : null}
                  {review.comment ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {review.comment}
                    </p>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma avaliação disponível para este usuário.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
