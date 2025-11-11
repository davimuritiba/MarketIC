import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import MessagesClient, {
  type OwnerInterestCardData,
  type UserInterestCardData,
} from "./messages-client";

export const dynamic = "force-dynamic";

const transactionLabelMap: Record<string, string> = {
  VENDA: "Venda",
  DOACAO: "Doação",
  EMPRESTIMO: "Empréstimo",
};

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
          telefone: true,
          foto_documento_url: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });
  const userInterests = await prisma.interesse.findMany({
    where: {
      usuario_id: session.usuario_id,
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
          usuario: {
            select: {
              id: true,
              nome: true,
              email_institucional: true,
              telefone: true,
              foto_documento_url: true,
            },
          },
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const ownerInterestsData: OwnerInterestCardData[] = interests
    .filter((interest) => interest.item && interest.usuario)
    .map((interest) => {
      const item = interest.item!;
      const interestedUser = interest.usuario!;

      return {
        id: interest.id,
        status: interest.status,
        shareEmail: interest.share_email,
        sharePhone: interest.share_phone,
        item: {
          id: item.id,
          title: item.titulo,
          transactionLabel:
            transactionLabelMap[item.tipo_transacao] ?? item.tipo_transacao,
          imageUrl: item.imagens?.[0]?.url ?? null,
        },
        interestedUser: {
          id: interestedUser.id,
          name: interestedUser.nome,
          email: interestedUser.email_institucional,
          phone: interestedUser.telefone,
          course: interestedUser.curso,
          avatarUrl: interestedUser.foto_documento_url,
        },
      } satisfies OwnerInterestCardData;
    });

  const userInterestsData: UserInterestCardData[] = userInterests
    .filter((interest) => interest.item)
    .map((interest) => {
      const item = interest.item!;

      return {
        id: interest.id,
        status: interest.status,
        shareEmail: interest.share_email,
        sharePhone: interest.share_phone,
        item: {
          id: item.id,
          title: item.titulo,
          transactionLabel:
            transactionLabelMap[item.tipo_transacao] ?? item.tipo_transacao,
          imageUrl: item.imagens?.[0]?.url ?? null,
          owner: {
            id: item.usuario?.id ?? null,
            name: item.usuario?.nome ?? null,
            email: item.usuario?.email_institucional ?? null,
            phone: item.usuario?.telefone ?? null,
            avatarUrl: item.usuario?.foto_documento_url ?? null,
          },
        },
      } satisfies UserInterestCardData;
    });

  return (
    <MessagesClient
      ownerInterests={ownerInterestsData}
      userInterests={userInterestsData}
    />
  );
}
