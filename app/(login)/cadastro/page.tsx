import Link from "next/link";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CadastroPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-neutral-100 px-4">
      <Card className="w-full max-w-sm sm:max-w-md md:max-w-lg rounded-2xl shadow-lg bg-white">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl md:text-3xl">Crie sua conta</CardTitle>
          <CardDescription>Preencha os dados abaixo para se cadastrar</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="nome" className="text-sm font-semibold">
              Nome
            </label>
            <Input id="nome" type="text" placeholder="Seu nome" className="h-10 bg-neutral-100" />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold">
              E-mail
            </label>
            <Input id="email" type="email" placeholder="nome@ic.ufal.br" className="h-10 bg-neutral-100" />
          </div>

          <div className="space-y-2">
            <label htmlFor="senha" className="text-sm font-semibold">
              Senha
            </label>
            <Input id="senha" type="password" placeholder="••••••••" className="h-10 bg-neutral-100" />
          </div>

          <div className="space-y-2">
            <label htmlFor="curso" className="text-sm font-semibold">
              Curso
            </label>
            <Select>
              <SelectTrigger className="h-10 bg-neutral-100">
                <SelectValue placeholder="Selecione seu curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cc">Ciência da Computação</SelectItem>
                <SelectItem value="ec">Engenharia da Computação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full h-10 rounded-lg bg-[#1500FF] hover:bg-[#1200d6] transition-colors">
            Cadastrar
          </Button>

          <div className="text-sm flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              Já tem uma conta?{" "}
              <Link href="/login" className="text-[#1500FF] underline underline-offset-4 hover:opacity-80">
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
