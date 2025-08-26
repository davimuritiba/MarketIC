"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function EsqueciSenhaPage() {
  const [step, setStep] = useState<"email" | "codigo">("email");

  return (
    <div className="min-h-screen grid place-items-center bg-neutral-100 px-4">
      {step === "email" && (
        <Card className="w-full max-w-sm rounded-2xl shadow-lg bg-white">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Esqueceu sua senha?</CardTitle>
            <CardDescription>
              Digite seu e-mail para receber o código de recuperação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold">
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                placeholder="nome@ic.ufal.br"
                className="h-10 bg-neutral-100"
              />
            </div>
            <Button
              className="cursor-pointer w-full h-10 rounded-lg bg-[#1500FF] hover:bg-[#1200d6]"
              onClick={() => setStep("codigo")}
            >
              Continuar
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "codigo" && (
        <Card className="w-full max-w-sm rounded-2xl shadow-lg bg-white">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Digite o código</CardTitle>
            <CardDescription>
              Enviamos um código de recuperação para seu e-mail
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="codigo" className="text-sm font-semibold">
                Código
              </label>
              <Input
                id="codigo"
                type="text"
                placeholder=""
                className="h-10 bg-neutral-100 tracking-widest"
              />
            </div>
            <Button className="cursor-pointer w-full h-10 rounded-lg bg-[#1500FF] hover:bg-[#1200d6]">
              Confirmar código
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
