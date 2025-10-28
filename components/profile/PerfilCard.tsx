// components/profile/ProfileCard.tsx
"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent,} from "react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Calendar, GraduationCap, IdCard, Mail, Phone, Star } from "lucide-react";

import { resolveCourseLabel } from "@/lib/course-labels";

export interface CourseOption {
  value: string;
  label: string;
}
import type { ProfileUserData } from "@/types/profile";

type FormState = {
  nome: string;
  telefone: string;
  curso: string;
  dataNascimento: string;
  rg: string;
  fotoDocumentoUrl: string;
};

type PreviewFile = {
  file: File;
  preview: string;
};

function toFormState(user: ProfileUserData): FormState {
  return {
    nome: user.nome ?? "",
    telefone: user.telefone ?? "",
    curso: user.curso ?? "",
    dataNascimento: user.dataNascimento
      ? user.dataNascimento.slice(0, 10)
      : "",
    rg: user.rg ?? "",
    fotoDocumentoUrl: user.fotoDocumentoUrl ?? "",
  };
}

function formatDate(value: string | null) {
  if (!value) return "Data de nascimento não informada";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Data de nascimento não informada";
  }
  date.setDate(date.getDate() + 1);
  return date.toLocaleDateString("pt-BR");
}

function formatCpf(cpf: string) {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatRg(rg: string | null) {
  if (!rg) return "RG não informado";
  const digits = rg.replace(/\D/g, "");
  if (digits.length < 8) return rg;
  return digits.replace(/(\d{2})(\d{3})(\d{3})([\dXx]{1,2})/, "$1.$2.$3-$4");
}

function formatPhone(phone: string | null) {
  if (!phone) return "Telefone não informado";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return phone;
  const match = digits.match(/(\d{2})(\d{4,5})(\d{4})/);
  if (!match) return phone;
  return `(${match[1]}) ${match[2]}-${match[3]}`;
}

function getInitials(name?: string | null) {
  if (!name) return "US";
  const parts = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase());

  const initials = parts.join("");
  if (initials) {
    return initials;
  }

  return name.charAt(0).toUpperCase();
}

type ProfileCardProps = {
  user: ProfileUserData;
  courses: CourseOption[];
};

export default function ProfileCard({ user, courses }: ProfileCardProps) {
  const [currentUser, setCurrentUser] = useState<ProfileUserData>(user);
  const [formState, setFormState] = useState<FormState>(() => toFormState(user));
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [fotoDocumento, setFotoDocumento] = useState<PreviewFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const { courseOptions, courseLabelMap } = useMemo(() => {
    const map = new Map<string, string>();
    for (const course of courses) {
      map.set(course.value, course.label);
    }

    if (currentUser.curso && !map.has(currentUser.curso)) {
      const label = resolveCourseLabel(currentUser.curso);
      map.set(currentUser.curso, label ?? currentUser.curso);
    }

    const options = Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

    return { courseOptions: options, courseLabelMap: map };
  }, [courses, currentUser.curso]);

  useEffect(() => {
    return () => {
      if (fotoDocumento) {
        URL.revokeObjectURL(fotoDocumento.preview);
      }
    };
  }, [fotoDocumento]);

  const convertFileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          resolve(result);
        } else {
          reject(new Error("Não foi possível processar o arquivo selecionado."));
        }
      };
      reader.onerror = () => {
        reject(
          new Error(
            "Erro ao ler o arquivo selecionado. Por favor, tente novamente.",
          ),
        );
      };
      reader.readAsDataURL(file);
    });

  const handleFotoDocumentoChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

    if (file.size > MAX_IMAGE_SIZE) {
      setErrorMessage("A imagem deve ter no máximo 5MB.");
      return;
    }

    setErrorMessage(null);

    setFotoDocumento((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev.preview);
      }

      return {
        file,
        preview: URL.createObjectURL(file),
      };
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFotoDocumento = () => {
    setFotoDocumento((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev.preview);
      }

      return null;
    });

    setFormState((prev) => ({
      ...prev,
      fotoDocumentoUrl: "",
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (!formState.nome.trim()) {
        throw new Error("Informe seu nome completo.");
      }

      if (!formState.dataNascimento) {
        throw new Error("Informe sua data de nascimento.");
      }

      if (!formState.rg.trim()) {
        throw new Error("Informe seu RG.");
      }

      let fotoDocumentoUrlToSend: string | null = null;

      if (fotoDocumento) {
        fotoDocumentoUrlToSend = await convertFileToBase64(fotoDocumento.file);
      } else {
        fotoDocumentoUrlToSend = formState.fotoDocumentoUrl.trim()
          ? formState.fotoDocumentoUrl.trim()
          : null;
      }

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: formState.nome.trim(),
          telefone: formState.telefone.trim() || null,
          curso: formState.curso.trim() || null,
          rg: formState.rg.trim(),
          fotoDocumentoUrl: fotoDocumentoUrlToSend,
          dataNascimento: new Date(formState.dataNascimento).toISOString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Não foi possível salvar as alterações.");
      }

      const data = (await response.json()) as { user: ProfileUserData };
      setCurrentUser({
        ...data.user,
        dataNascimento: data.user.dataNascimento,
        fotoDocumentoUrl: data.user.fotoDocumentoUrl,
        rg: data.user.rg,
      });
      setFormState(toFormState(data.user));
      setFotoDocumento((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev.preview);
        }
        return null;
      });
      setOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro inesperado ao salvar as alterações.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      setFormState(toFormState(currentUser));
      setErrorMessage(null);
      setFotoDocumento((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev.preview);
        }
        return null;
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteProfile = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch("/api/profile", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Não foi possível excluir o perfil.");
      }

      setDeleteOpen(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      if (error instanceof Error) {
        setDeleteError(error.message);
      } else {
        setDeleteError("Erro inesperado ao excluir o perfil.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const rating = currentUser.reputacaoMedia ?? 0;
  const ratingCount = currentUser.reputacaoCount ?? 0;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col items-center space-y-4">
        <Avatar className="h-32 w-32 border-2 border-neutral-200 shadow-sm">
          <AvatarImage
            src={currentUser.fotoDocumentoUrl ?? undefined}
            alt={currentUser.nome}
            className="object-cover"
          />
          <AvatarFallback className="text-2xl font-semibold uppercase bg-neutral-100 text-neutral-500">
            {getInitials(currentUser.nome)}
          </AvatarFallback>
        </Avatar>
        <CardTitle className="text-lg">{currentUser.nome}</CardTitle>

        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="cursor-pointer w-full bg-[#1500FF] hover:bg-[#1200d6]">
              Editar perfil
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Editar Perfil</DialogTitle>
              <DialogDescription>Atualize suas informações</DialogDescription>
            </DialogHeader>

            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="nome" className="text-sm font-semibold">
                  Nome
                </label>
                <Input
                  id="nome"
                  value={formState.nome}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      nome: event.target.value,
                    }))
                  }
                  placeholder="Seu nome"
                  className="h-10 bg-neutral-100"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold">
                  Email institucional
                </label>
                <Input
                  id="email"
                  type="email"
                  value={currentUser.emailInstitucional}
                  disabled
                  className="h-10 bg-neutral-100"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="telefone" className="text-sm font-semibold">
                  Telefone
                </label>
                <Input
                  id="telefone"
                  value={formState.telefone}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      telefone: event.target.value,
                    }))
                  }
                  placeholder="(82) 99999-9999"
                  className="h-10 bg-neutral-100"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="data-nascimento" className="text-sm font-semibold">
                  Data de nascimento
                </label>
                <Input
                  id="data-nascimento"
                  type="date"
                  value={formState.dataNascimento}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      dataNascimento: event.target.value,
                    }))
                  }
                  className="h-10 bg-neutral-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Curso</label>
                <Select
                  value={formState.curso || undefined}
                  onValueChange={(value) =>
                    setFormState((prev) => ({
                      ...prev,
                      curso: value,
                    }))
                  }
                >
                  <SelectTrigger className="cursor-pointer h-10 bg-neutral-100">
                    <SelectValue placeholder="Selecione seu curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {courseOptions.map((course) => (
                      <SelectItem
                        key={course.value}
                        className="cursor-pointer"
                        value={course.value}
                      >
                        {course.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="rg" className="text-sm font-semibold">
                  RG
                </label>
                <Input
                  id="rg"
                  value={formState.rg}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      rg: event.target.value,
                    }))
                  }
                  placeholder="00.000.000-0"
                  className="h-10 bg-neutral-100"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="cpf" className="text-sm font-semibold">
                  CPF
                </label>
                <Input
                  id="cpf"
                  value={formatCpf(currentUser.cpf)}
                  disabled
                  className="h-10 bg-neutral-100"
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-semibold"
                  htmlFor="fotoDocumento"
                >
                  Foto do documento
                </label>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <input
                    ref={fileInputRef}
                    id="fotoDocumento"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFotoDocumentoChange}
                  />

                  <Button
                    type="button"
                    className="w-full sm:w-auto cursor-pointer bg-[#1500FF] hover:bg-[#1200d6]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Selecionar foto
                  </Button>

                  {fotoDocumento || formState.fotoDocumentoUrl ? (
                    <div className="flex items-center gap-3">
                      <div className="h-20 w-20 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
                        <img
                          src={
                            fotoDocumento
                              ? fotoDocumento.preview
                              : formState.fotoDocumentoUrl
                          }
                          alt="Pré-visualização do documento"
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        className="cursor-pointer px-3"
                        onClick={handleRemoveFotoDocumento}
                      >
                        Remover
                      </Button>
                    </div>
                  ) : null}
                </div>

                <p className="text-xs text-muted-foreground">
                  Formatos suportados: JPG, PNG ou WEBP. Tamanho máximo de 5MB.
                </p>
              </div>

              {errorMessage && (
                <p className="text-sm text-red-600">{errorMessage}</p>
              )}

              <DialogFooter className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="cursor-pointer bg-[#1500FF] hover:bg-[#1200d6]"
                  disabled={isSaving}
                >
                  {isSaving ? "Salvando..." : "Salvar mudanças"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-35">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Informações do usuário</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="text-base flex items-center gap-2">
              <Mail size={20} /> {currentUser.emailInstitucional}
            </li>
            <li className="text-base flex items-center gap-2">
              <Phone size={20} /> {formatPhone(currentUser.telefone)}
            </li>
            <li className="text-base flex items-center gap-2">
              <Calendar size={20} /> {formatDate(currentUser.dataNascimento)}
            </li>
            <li className="text-base flex items-center gap-2">
              <IdCard size={20} /> CPF: {formatCpf(currentUser.cpf)}
            </li>
            <li className="text-base flex items-center gap-2">
              <IdCard size={20} /> RG: {formatRg(currentUser.rg)}
            </li>
            {currentUser.curso && (
              <li className="text-base flex items-center gap-2">
                <GraduationCap size={20} />
                {courseLabelMap.get(currentUser.curso) ??
                  resolveCourseLabel(currentUser.curso)}
              </li>
            )}
          </ul>
        </div>

        <div className="space-y-4">
          <Dialog
            open={deleteOpen}
            onOpenChange={(value) => {
              setDeleteOpen(value);
              if (!value) {
                setDeleteError(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="cursor-pointer w-full bg-red-600 text-white hover:bg-red-700">
                Excluir perfil
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px]">
              <DialogHeader>
                <DialogTitle>Excluir perfil</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja excluir seu perfil? Todos os seus anúncios
                  previamentes postados serão excluídos, assim como seus anúncios
                  ativos.
                </DialogDescription>
              </DialogHeader>
              {deleteError && (
                <p className="text-sm text-red-600">{deleteError}</p>
              )}
              <DialogFooter className="mt-2">
                <Button
                  type="button"
                  className="cursor-pointer bg-neutral-300 text-neutral-800 hover:bg-neutral-400"
                  onClick={() => setDeleteOpen(false)}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="cursor-pointer  bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleDeleteProfile}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Excluindo..." : "Excluir"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Classificação do usuário</h3>
            {ratingCount > 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex text-yellow-500">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        size={22}
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
                Você ainda não possui nenhuma avaliação.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
