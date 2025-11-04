import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, X } from "lucide-react";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const transactionLabelMap: Record<string, string> = {
  VENDA: "Venda",
  DOACAO: "Doação",
  EMPRESTIMO: "Empréstimo",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
}

export default async function MensagensPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const interests = await prisma.interesse.findMany({
    where: {
      item: {
        usuario_id: session.usuario_id,
      },
    },
    include: {
      item: {
        select: {
          id: true,
          titulo: true,
          tipo_transacao: true,
          imagens: {
            orderBy: { ordem: "asc" },
            take: 1,
            select: { url: true },
          },
        },
      },
      usuario: {
        select: {
          id: true,
          nome: true,
          email_institucional: true,
          curso: true,
          foto_documento_url: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-neutral-900">Mensagens</h1>
        <p className="text-sm text-neutral-600">
          Acompanhe as pessoas interessadas nos seus anúncios e responda quando
          estiver pronto.
        </p>
      </div>

      {interests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
          Nenhum usuário demonstrou interesse nos seus anúncios por enquanto.
        </div>
      ) : (
        <div className="space-y-5">
          {interests.map((interest) => {
            const item = interest.item;
            const interestedUser = interest.usuario;

            if (!item || !interestedUser) {
              return null;
            }

            const imageUrl = item.imagens?.[0]?.url ?? null;
            const transactionLabel =
              transactionLabelMap[item.tipo_transacao] ?? item.tipo_transacao;
            const userName = interestedUser.nome ?? "Usuário";
            const userEmail =
              interestedUser.email_institucional ?? "E-mail não informado";
            const userCourse = interestedUser.curso ?? "Curso não informado";
            const userAvatar = interestedUser.foto_documento_url;
            const initials = getInitials(userName || "U");

            return (
              <div
                key={interest.id}
                className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-xl bg-neutral-100">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={`Imagem do anúncio ${item.titulo}`}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
                          sem foto
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                        Anúncio
                      </span>
                      <Link
                        href={`/produto/${item.id}`}
                        className="text-lg font-semibold text-neutral-900 hover:text-blue-600"
                      >
                        {item.titulo}
                      </Link>
                      <span className="text-sm text-neutral-500">{transactionLabel}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start">
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-full border border-green-200 px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50 cursor-pointer"
                    >
                      <Check className="h-4 w-4" /> Aceitar
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <X className="h-4 w-4" /> Recusar
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex items-start gap-4 border-t border-neutral-200 pt-6">
                  <div className="h-14 w-14 overflow-hidden rounded-full bg-neutral-100 text-sm font-semibold text-neutral-500">
                    {userAvatar ? (
                      <Image
                        src={userAvatar}
                        alt={`Foto de ${userName}`}
                        width={56}
                        height={56}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        {initials || "U"}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-semibold text-neutral-900">
                      {userName}
                    </span>
                    <span className="text-sm text-neutral-500">{userEmail}</span>
                    <span className="text-sm text-neutral-600">{userCourse}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
