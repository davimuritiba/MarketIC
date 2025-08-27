// components/profile/ProfileCard.tsx
"use client";

import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Mail, Phone, Calendar, Star, X } from "lucide-react";

export default function ProfileCard() {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col items-center space-y-4">
        <Avatar className="h-30 w-30">
          <AvatarImage src="/images/user.jpg" alt="Usuário" />
        </Avatar>
        <CardTitle className="text-lg">Nome do usuário</CardTitle>

        <Dialog>
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

            <form
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                // submit aqui se quiser
              }}
            >
              <div className="space-y-2">
                <label htmlFor="nome" className="text-sm font-semibold">Nome</label>
                <Input id="nome" placeholder="Seu nome" className="h-10 bg-neutral-100" />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold">Email</label>
                <Input id="email" type="email" placeholder="email@ic.ufal.br" className="h-10 bg-neutral-100" />
              </div>

              <div className="space-y-2">
                <label htmlFor="senha" className="text-sm font-semibold">Senha</label>
                <Input id="senha" type="password" placeholder="••••••••" className="h-10 bg-neutral-100" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Curso</label>
                <Select>
                  <SelectTrigger className="cursor-pointer h-10 bg-neutral-100">
                    <SelectValue placeholder="Selecione seu curso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem className="cursor-pointer" value="cc">Ciência da Computação</SelectItem>
                    <SelectItem className="cursor-pointer" value="ec">Engenharia da Computação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="mt-2">
                <DialogClose asChild>
                  <Button className="cursor-pointer" variant="outline">Cancelar</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button type="submit" className="cursor-pointer bg-[#1500FF] hover:bg-[#1200d6]">
                    Salvar mudanças
                  </Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-40">
        <div>
          <h3 className="text-xl font-semibold mb-2">Informações do usuário</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="text-base flex items-center gap-2"><Mail size={22} /> email@email.com</li>
            <li className="text-base flex items-center gap-2"><Phone size={22} /> (82) 91234-8888</li>
            <li className="text-base flex items-center gap-2"><Calendar size={22} /> 10/10/2010</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Classificação do usuário</h3>
          <div className="flex items-center gap-2">
            <div className="flex text-yellow-500">
              <Star size={22} fill="currentColor" />
              <Star size={22} fill="currentColor" />
              <Star size={22} fill="currentColor" />
              <Star size={22} fill="currentColor" />
              <Star size={22} fill="currentColor" />
            </div>
            <span className="text-sm text-muted-foreground">5 de 5</span>
          </div>
          <p className="text-sm text-muted-foreground">163 avaliações</p>
        </div>
      </CardContent>
    </Card>
  );
}
