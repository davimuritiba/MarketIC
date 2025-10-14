"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [emailInstitucional, setEmailInstitucional] = useState("");
  const [senha, setSenha] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailInstitucional,
          senha,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const error = data?.error ?? "Não foi possível realizar o login.";
        throw new Error(error);
      }

      router.push("/");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível realizar o login.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-neutral-100 px-4">
      <Card className="w-full max-w-sm sm:max-w-md md:max-w-lg rounded-2xl shadow-lg bg-white">
        <CardHeader className="space-y-4">
          <div className="w-16 h-16 rounded-full bg-neutral-200 grid place-items-center overflow-hidden">
            <Image
              src="/images/marketic avatar logo.png"
              alt="MarketIC"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>

          <div>
            <CardTitle className="text-2xl md:text-3xl">Acesse sua conta</CardTitle>
            <CardDescription>Acesse sua conta através do e-mail</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold">
                E-mail
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
              <label htmlFor="password" className="text-sm font-semibold">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-10 bg-neutral-100"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                required
              />
            </div>

            {errorMessage ? (
              <p className="text-sm text-red-600" role="alert">
                {errorMessage}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={isSubmitting}
              className=" cursor-pointer w-full h-10 rounded-lg bg-[#1500FF] hover:bg-[#1200d6] transition-colors disabled:opacity-70"
            >
              {isSubmitting ? "Entrando..." : "Continuar"}
            </Button>
          </form>

          <div className="text-sm flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <Link
              href="/login/senha"
              className="underline underline-offset-4 hover:opacity-80"
            >
              Esqueceu sua senha?
            </Link>
            <div>
              Não tem uma conta?{" "}
              <Link
                href="/cadastro"
                className="text-[#1500FF] underline underline-offset-4 hover:opacity-80"
              >
                Cadastre-se
              </Link>
            </div>
          </div>
        </CardContent>

        <CardFooter />
      </Card>
    </div>
  );
}
