"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { resolveCourseLabel } from "@/lib/course-labels";
import { formatBrazilianPhone } from "@/lib/phone";

export type InterestStatus = "PENDENTE" | "ACEITO" | "RECUSADO";

export type OwnerInterestCardData = {
  id: string;
  status: InterestStatus;
  shareEmail: boolean;
  sharePhone: boolean;
  item: {
    id: string;
    title: string;
    transactionLabel: string;
    imageUrl: string | null;
  };
  interestedUser: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    course: string | null;
    avatarUrl: string | null;
  };
};

export type UserInterestCardData = {
  id: string;
  status: InterestStatus;
  shareEmail: boolean;
  sharePhone: boolean;
  item: {
    id: string;
    title: string;
    transactionLabel: string;
    imageUrl: string | null;
    owner: {
      name: string | null;
      email: string | null;
      phone: string | null;
      avatarUrl: string | null;
    };
  };
};

interface MessagesClientProps {
  ownerInterests: OwnerInterestCardData[];
  userInterests: UserInterestCardData[];
}

const statusLabelMap: Record<InterestStatus, string> = {
  PENDENTE: "Pendente",
  ACEITO: "Aceito",
  RECUSADO: "Recusado",
};

const statusClassMap: Record<InterestStatus, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-800",
  ACEITO: "bg-green-100 text-green-700",
  RECUSADO: "bg-red-100 text-red-700",
};

function AvatarCircle({
  imageUrl,
  fallback,
}: {
  imageUrl: string | null;
  fallback: string;
}) {
  return (
    <div className="h-14 w-14 overflow-hidden rounded-full bg-neutral-100 text-sm font-semibold text-neutral-500">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt="Avatar"
          width={56}
          height={56}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">{fallback}</div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: InterestStatus }) {
  const classes = statusClassMap[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${classes}`}
    >
      {statusLabelMap[status]}
    </span>
  );
}

function OwnerInterestCard({
  interest,
  onUpdate,
}: {
  interest: OwnerInterestCardData;
  onUpdate: (updates: {
    status: InterestStatus;
    shareEmail: boolean;
    sharePhone: boolean;
  }) => void;
}) {
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState(true);
  const [sharePhone, setSharePhone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const isPending = interest.status === "PENDENTE";
  const interestedName = interest.interestedUser.name ?? "Usuário";
  const initials = interestedName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2) || "U";

  const formattedCourse = interest.interestedUser.course
    ? resolveCourseLabel(interest.interestedUser.course) ??
      interest.interestedUser.course
    : null;

  const formattedPhone = formatBrazilianPhone(interest.interestedUser.phone);

  const handleOpenAccept = () => {
    const initialEmail = interest.shareEmail;
    const initialPhone = interest.sharePhone;

    if (!initialEmail && !initialPhone) {
      setShareEmail(true);
      setSharePhone(false);
    } else {
      setShareEmail(initialEmail);
      setSharePhone(initialPhone);
    }
    setAcceptError(null);
    setAcceptOpen(true);
  };

  const handleConfirmAccept = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setAcceptError(null);

    try {
      const response = await fetch(`/api/interests/${interest.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "accept",
          shareEmail,
          sharePhone,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setAcceptError(
          payload?.error ?? "Não foi possível aceitar o interesse.",
        );
        return;
      }

      const payload = await response.json().catch(() => null);
      const updated = payload?.interest;

      if (!updated) {
        setAcceptError("Resposta inesperada do servidor.");
        return;
      }

      onUpdate({
        status: updated.status ?? interest.status,
        shareEmail: Boolean(updated.shareEmail),
        sharePhone: Boolean(updated.sharePhone),
      });
      setAcceptOpen(false);
    } catch (error) {
      console.error("Erro ao aceitar interesse", error);
      setAcceptError("Erro inesperado ao aceitar o interesse.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReject = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setRejectError(null);

    try {
      const response = await fetch(`/api/interests/${interest.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "reject" }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setRejectError(
          payload?.error ?? "Não foi possível recusar o interesse.",
        );
        return;
      }

      const payload = await response.json().catch(() => null);
      const updated = payload?.interest;

      if (!updated) {
        setRejectError("Resposta inesperada do servidor.");
        return;
      }

      onUpdate({
        status: updated.status ?? interest.status,
        shareEmail: Boolean(updated.shareEmail),
        sharePhone: Boolean(updated.sharePhone),
      });
      setRejectOpen(false);
    } catch (error) {
      console.error("Erro ao recusar interesse", error);
      setRejectError("Erro inesperado ao recusar o interesse.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-xl bg-neutral-100">
            {interest.item.imageUrl ? (
              <Image
                src={interest.item.imageUrl}
                alt={`Imagem do anúncio ${interest.item.title}`}
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
              href={`/produto/${interest.item.id}`}
              className="text-lg font-semibold text-neutral-900 hover:text-blue-600"
            >
              {interest.item.title}
            </Link>
            <span className="text-sm text-neutral-500">
              {interest.item.transactionLabel}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 self-start text-right">
          <StatusBadge status={interest.status} />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAccept}
              disabled={!isPending || isSubmitting}
              className="flex items-center gap-2 rounded-full border border-green-200 px-4 py-2 text-sm font-medium text-green-600 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <Check className="h-4 w-4" /> Aceitar
            </button>
            <button
              type="button"
              onClick={() => {
                setRejectError(null);
                setRejectOpen(true);
              }}
              disabled={!isPending || isSubmitting}
              className="flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <X className="h-4 w-4" /> Recusar
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-4 border-t border-neutral-200 pt-6">
        <AvatarCircle imageUrl={interest.interestedUser.avatarUrl} fallback={initials} />
        <div className="flex flex-col">
          <span className="text-base font-semibold text-neutral-900">
            {interestedName}
          </span>
          <span className="text-sm text-neutral-500">
            {interest.interestedUser.email ?? "E-mail não informado"}
          </span>
          <span className="text-sm text-neutral-600">
            {formattedCourse ?? "Curso não informado"}
          </span>
          {interest.interestedUser.phone ? (
            <span className="text-sm text-neutral-600">
              {formattedPhone ?? interest.interestedUser.phone}
            </span>
          ) : null}
        </div>
      </div>

      <Dialog
        open={acceptOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsSubmitting(false);
            setAcceptError(null);
          }
          setAcceptOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aceitar interesse</DialogTitle>
            <DialogDescription>
              Selecione quais contatos deseja compartilhar com o interessado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="flex items-center gap-3 text-sm font-medium text-neutral-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-300"
                checked={shareEmail}
                onChange={(event) => setShareEmail(event.target.checked)}
              />
              E-mail institucional
            </label>
            <label className="flex items-center gap-3 text-sm font-medium text-neutral-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-300"
                checked={sharePhone}
                onChange={(event) => setSharePhone(event.target.checked)}
              />
              Telefone
            </label>
            {acceptError ? (
              <p className="text-sm text-red-600">{acceptError}</p>
            ) : null}
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAcceptOpen(false)}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmAccept}
              disabled={isSubmitting || (!shareEmail && !sharePhone)}
              className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
            >
              {isSubmitting ? "Salvando..." : "Aceitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsSubmitting(false);
            setRejectError(null);
          }
          setRejectOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tem certeza que deseja recusar</DialogTitle>
          </DialogHeader>
          {rejectError ? (
            <p className="text-sm text-red-600">{rejectError}</p>
          ) : null}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmReject}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {isSubmitting ? "Recusando..." : "Recusar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserInterestCard({ interest }: { interest: UserInterestCardData }) {
  const ownerName = interest.item.owner.name ?? "Anunciante";
  const ownerInitials = ownerName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2) || "A";

  const contactDisplay = (() => {
    if (interest.status !== "ACEITO") {
      return "O contato será exibido quando o interesse for aceito.";
    }

    const parts: string[] = [];

    if (interest.shareEmail && interest.item.owner.email) {
      parts.push(interest.item.owner.email);
    }

    if (interest.sharePhone && interest.item.owner.phone) {
      const formattedPhone =
        formatBrazilianPhone(interest.item.owner.phone) ??
        interest.item.owner.phone;
      parts.push(formattedPhone);
    }

    if (parts.length === 0) {
      return "O anunciante aceitou sem compartilhar contato.";
    }

    return parts.join(" | ");
  })();

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-xl bg-neutral-100">
            {interest.item.imageUrl ? (
              <Image
                src={interest.item.imageUrl}
                alt={`Imagem do anúncio ${interest.item.title}`}
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
              href={`/produto/${interest.item.id}`}
              className="text-lg font-semibold text-neutral-900 hover:text-blue-600"
            >
              {interest.item.title}
            </Link>
            <span className="text-sm text-neutral-500">
              {interest.item.transactionLabel}
            </span>
          </div>
        </div>
        <StatusBadge status={interest.status} />
      </div>

      <div className="mt-6 flex items-start gap-4 border-t border-neutral-200 pt-6">
        <AvatarCircle
          imageUrl={interest.item.owner.avatarUrl}
          fallback={ownerInitials}
        />
        <div className="flex flex-col">
          <span className="text-base font-semibold text-neutral-900">
            {ownerName}
          </span>
          <span className="text-sm text-neutral-600">Contato: {contactDisplay}</span>
        </div>
      </div>
    </div>
  );
}

export default function MessagesClient({
  ownerInterests,
  userInterests,
}: MessagesClientProps) {
  const [activeTab, setActiveTab] = useState<"owner" | "interests">("owner");
  const [ownerItems, setOwnerItems] = useState(ownerInterests);

  const subtitle =
    activeTab === "owner"
      ? "Acompanhe as pessoas interessadas nos seus anúncios e responda quando estiver pronto."
      : "Veja os anúncios em que você demonstrou interesse e acompanhe o andamento de cada solicitação.";

  const handleUpdateOwnerInterest = (
    id: string,
    updates: { status: InterestStatus; shareEmail: boolean; sharePhone: boolean },
  ) => {
    setOwnerItems((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              status: updates.status,
              shareEmail: updates.shareEmail,
              sharePhone: updates.sharePhone,
            }
          : item,
      ),
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10 md:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-neutral-900">Mensagens</h1>
        <p className="text-sm text-neutral-600">{subtitle}</p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "owner" | "interests") }>
        <TabsList>
          <TabsTrigger value="owner" className="cursor-pointer">Seus anúncios</TabsTrigger>
          <TabsTrigger value="interests" className="cursor-pointer">Interesses</TabsTrigger>
        </TabsList>
        <TabsContent value="owner" className="mt-4 space-y-5">
          {ownerItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
              Nenhum usuário demonstrou interesse nos seus anúncios por enquanto.
            </div>
          ) : (
            ownerItems.map((interest) => (
              <OwnerInterestCard
                key={interest.id}
                interest={interest}
                onUpdate={(updates) => handleUpdateOwnerInterest(interest.id, updates)}
              />
            ))
          )}
        </TabsContent>
        <TabsContent value="interests" className="mt-4 space-y-5">
          {userInterests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
              Você ainda não demonstrou interesse em nenhum anúncio.
            </div>
          ) : (
            userInterests.map((interest) => (
              <UserInterestCard key={interest.id} interest={interest} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
