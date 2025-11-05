"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { isValidBrazilianPhone, normalizeBrazilianPhone } from "@/lib/phone";

const DEFAULT_COURSES = [
  { value: "cc", label: "Ciência da Computação" },
  { value: "ec", label: "Engenharia da Computação" },
];

const sanitizeCpf = (value: string) => value.replace(/\D/g, "");

const isValidCpf = (value: string) => {
  const cpf = sanitizeCpf(value);

  if (cpf.length !== 11 || /^([0-9])\1{10}$/.test(cpf)) {
    return false;
  }

  const digits = cpf.split("").map((digit) => Number.parseInt(digit, 10));

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += digits[i] * (10 - i);
  }
  let firstVerifier = (sum * 10) % 11;
  if (firstVerifier === 10) {
    firstVerifier = 0;
  }
  if (digits[9] !== firstVerifier) {
    return false;
  }

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += digits[i] * (11 - i);
  }
  let secondVerifier = (sum * 10) % 11;
  if (secondVerifier === 10) {
    secondVerifier = 0;
  }

  return digits[10] === secondVerifier;
};

const formatCpf = (value: string) => {
  const digits = sanitizeCpf(value);

  const part1 = digits.slice(0, 3);
  const part2 = digits.slice(3, 6);
  const part3 = digits.slice(6, 9);
  const part4 = digits.slice(9, 11);

  let formatted = part1;
  if (part2) {
    formatted += `.${part2}`;
  }
  if (part3) {
    formatted += `.${part3}`;
  }
  if (part4) {
    formatted += `-${part4}`;
  }

  return formatted;
};

const formatPhoneInput = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length === 0) {
    return "";
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [emailInstitucional, setEmailInstitucional] = useState("");
  const [senha, setSenha] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [curso, setCurso] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  type PreviewFile = {
    file: File;
    preview: string;
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fotoDocumento, setFotoDocumento] = useState<PreviewFile | null>(null);

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
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    if (!curso) {
      setErrorMessage("Selecione seu curso.");
      setIsSubmitting(false);
      return;
    }

    try {
      const sanitizedCpf = sanitizeCpf(cpf);
      if (!isValidCpf(sanitizedCpf)) {
        setErrorMessage("Informe um CPF válido.");
        setIsSubmitting(false);
        return;
      }

      const normalizedPhone = normalizeBrazilianPhone(telefone);

      if (!isValidBrazilianPhone(normalizedPhone)) {
        setErrorMessage(
          "Informe um telefone válido com DDD e 9 dígitos (ex: (82) 90000-0000).",
        );
        setIsSubmitting(false);
        return;
      }

      if (!fotoDocumento) {
        setErrorMessage("Adicione uma foto do documento.");
        setIsSubmitting(false);
        return;
      }

      const fotoDocumentoBase64 = await convertFileToBase64(fotoDocumento.file);

      console.log("📤 Enviando dados para /api/register...");
      console.log({
        nome,
        emailInstitucional,
        cpf,
        rg,
        telefone: normalizedPhone,
        dataNascimento,
        curso,
      });

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          emailInstitucional,
          senha,
          cpf: sanitizedCpf,
          rg,
          telefone: normalizedPhone,
          dataNascimento,
          curso,
          fotoDocumentoUrl: fotoDocumentoBase64,
        }),
      });

      console.log("📥 Resposta recebida:", response);
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const error = data?.error ?? "Não foi possível realizar o cadastro.";
        throw new Error(error);
      }

      URL.revokeObjectURL(fotoDocumento.preview);
      setFotoDocumento(null);

      router.push("/");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível realizar o cadastro.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCpfChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCpf(event.target.value));
  };

  const handleTelefoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatPhoneInput(event.target.value));
  };

  return (
    <div className="min-h-screen grid place-items-center bg-neutral-100 px-4">
      <Card className="w-full max-w-sm sm:max-w-md md:max-w-lg rounded-2xl shadow-lg bg-white">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl md:text-3xl">Crie sua conta</CardTitle>
          <CardDescription>
            Preencha os dados abaixo para se cadastrar
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="nome" className="text-sm font-semibold">
                Nome
              </label>
              <Input
                id="nome"
                type="text"
                placeholder="Seu nome"
                className="h-10 bg-neutral-100"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold">
                E-mail institucional
              </label>
              <Input
                id="email"
                type="email"
                placeholder="nome@ic.ufal.br"
                className="h-10 bg-neutral-100"
                value={emailInstitucional}
                onChange={(event) => setEmailInstitucional(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="senha" className="text-sm font-semibold">
                Senha
              </label>
              <Input
                id="senha"
                type="password"
                placeholder="••••••••"
                className="h-10 bg-neutral-100"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                minLength={8}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="cpf" className="text-sm font-semibold">
                  CPF
                </label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  className="h-10 bg-neutral-100"
                  value={cpf}
                  onChange={handleCpfChange}
                  maxLength={14}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="rg" className="text-sm font-semibold">
                  RG
                </label>
                <Input
                  id="rg"
                  type="text"
                  placeholder="0000000"
                  className="h-10 bg-neutral-100"
                  value={rg}
                  onChange={(event) => setRg(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="telefone" className="text-sm font-semibold">
                  Telefone
                </label>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="(82) 90000-0000"
                  className="h-10 bg-neutral-100"
                  value={telefone}
                  onChange={handleTelefoneChange}
                  inputMode="numeric"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="dataNascimento" className="text-sm font-semibold">
                  Data de nascimento
                </label>
                <Input
                  id="dataNascimento"
                  type="date"
                  className="h-10 bg-neutral-100"
                  value={dataNascimento}
                  onChange={(event) => setDataNascimento(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="curso" className="text-sm font-semibold">
                Curso
              </label>
              <Select
                value={curso}
                onValueChange={(value) => setCurso(value)}
              >
                <SelectTrigger className="cursor-pointer h-10 bg-neutral-100">
                  <SelectValue
                    placeholder="Selecione seu curso"
                    className="cursor-pointer"
                  />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_COURSES.map((course) => (
                    <SelectItem
                      key={course.value}
                      value={course.value}
                      className="cursor-pointer"
                    >
                      {course.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="fotoDocumento">
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

                {fotoDocumento ? (
                  <div className="flex items-center gap-3">
                    <div className="h-20 w-20 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
                      <img
                        src={fotoDocumento.preview}
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

            {errorMessage ? (
              <p className="text-sm text-red-600" role="alert">
                {errorMessage}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer w-full h-10 rounded-lg bg-[#1500FF] hover:bg-[#1200d6] transition-colors disabled:opacity-70"
            >
              {isSubmitting ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </form>

          <div className="text-sm flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              Já tem uma conta?{" "}
              <Link
                href="/login"
                className="text-[#1500FF] underline underline-offset-4 hover:opacity-80"
              >
                Entrar
              </Link>
            </div>
          </div>
        </CardContent>

        <CardFooter />
      </Card>
    </div>
  );
}
