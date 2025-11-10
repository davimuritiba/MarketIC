"use client"

import type { FormEvent } from "react"
import { useState } from "react"

import { GraduationCap, Calendar, Star } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { resolveCourseLabel } from "@/lib/course-labels"
import type { PublicProfileUserData } from "@/types/profile"

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

type PublicProfileCardProps = {
  user: PublicProfileUserData
  viewerCanReviewUser: boolean
  viewerHasReviewedUser: boolean
}

export default function PublicProfileCard({
  user,
  viewerCanReviewUser,
  viewerHasReviewedUser,
}: PublicProfileCardProps) {
  const courseLabel = user.curso
    ? resolveCourseLabel(user.curso) ?? user.curso
    : "Curso não informado"
  const [rating, setRating] = useState(user.reputacaoMedia ?? 0)
  const [ratingCount, setRatingCount] = useState(user.reputacaoCount ?? 0)
  const [canReview, setCanReview] = useState(viewerCanReviewUser)
  const [hasReviewed, setHasReviewed] = useState(viewerHasReviewedUser)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [reviewTitle, setReviewTitle] = useState("")
  const [reviewComment, setReviewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setErrorMessage(null)
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
      const response = await fetch(`/api/users/${user.id}/reviews`, {
        method: "POST",
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

      setRating(updatedRating)
      setRatingCount(updatedRatingCount)
      setCanReview(false)
      setHasReviewed(true)
      setSuccessMessage("Avaliação enviada com sucesso!")
      setIsDialogOpen(false)
      setSelectedRating(null)
      setReviewTitle("")
      setReviewComment("")
    } catch (error) {
      console.error("Erro ao registrar avaliação do usuário", error)
      setErrorMessage("Não foi possível registrar a avaliação.")
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
                setSelectedRating(null)
                setReviewTitle("")
                setReviewComment("")
                setErrorMessage(null)
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
      </CardContent>
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Avaliar usuário</DialogTitle>
            <DialogDescription>
              Compartilhe sua experiência com outros compradores.
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
              <Button type="submit" disabled={isSubmitting} className="bg-[#1500FF] hover:bg-[#1200d6] cursor-pointer">
                {isSubmitting ? "Enviando..." : "Enviar avaliação"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}