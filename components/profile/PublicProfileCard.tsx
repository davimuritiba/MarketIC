"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Calendar, Star } from "lucide-react"

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
}

export default function PublicProfileCard({ user }: PublicProfileCardProps) {
  const courseLabel = user.curso
    ? resolveCourseLabel(user.curso) ?? user.curso
    : "Curso não informado"
  const rating = user.reputacaoMedia ?? 0
  const ratingCount = user.reputacaoCount ?? 0

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
        </section>
      </CardContent>
    </Card>
  )
}
