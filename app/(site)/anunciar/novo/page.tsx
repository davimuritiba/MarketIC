"use client";

import { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";

export default function NovoAnuncioPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tipoTransacao, setTipoTransacao] = useState("");
  const [estadoConservacao, setEstadoConservacao] = useState("");
  const [fileName, setFileName] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMensagem("Enviando...");

    try{
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          descricao,
          tipo_transacao: tipoTransacao.toUpperCase(),
          estado_conservacao: estadoConservacao.toUpperCase(),
          preco: 0,
          usuario_id: "6398473e-461e-4a07-a76e-111f627ef873", //temp
          categoria_id: "c0d49de1-54dc-409b-99c2-8f0af6867ae7" //temp
        }),
      });

      if (!res.ok) throw new Error("Erro ao criar o anúncio");

      setMensagem("Anúncio criado com sucesso!");
      setTitulo("");
      setDescricao("");
      setCategoria("");
      setTipoTransacao("");
      setEstadoConservacao("");
      setFileName("");
    } catch (error) {
      setMensagem("Erro ao criar o anúncio.");
    }
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-semibold mb-6">Novo Anúncio</h1>

      {/* painel principal */}
      <section className="rounded-xl border bg-white p-4 sm:p-6 md:p-8 shadow-sm">
        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="titulo" className="text-base font-semibold">Título</Label>
            <Input 
              id="titulo" 
              value={titulo} 
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Adicione um título"
              className="h-10" 
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao" className="text-base font-semibold">Descrição</Label>
            <Textarea 
              id="descricao" 
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Adicione uma descrição" 
              className="min-h-[96px]" 
            />
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Categoria</Label>
            <Select onValueChange={setCategoria}>
              <SelectTrigger className="h-10 cursor-pointer">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="cursor-pointer" value="eletronicos">Eletrônicos</SelectItem>
                <SelectItem className="cursor-pointer" value="livros">Livros</SelectItem>
                <SelectItem className="cursor-pointer" value="hobbies">Hobbies</SelectItem>
                <SelectItem className="cursor-pointer" value="esportes">Esportes</SelectItem>
                <SelectItem className="cursor-pointer" value="celulares">Celulares</SelectItem>
                <SelectItem className="cursor-pointer" value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>

            {/* Campo opcional quando escolher "Outros" */}
            {categoria === "outros" && (
              <div className="mt-3 space-y-2">
                <Label htmlFor="outra-categoria" className="text-sm font-medium">Outra categoria</Label>
                <Input id="outra-categoria" placeholder="Descreva a categoria" className="h-10" />
              </div>
            )}
          </div>

          {/* Tipo de transação */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Tipo de transação</Label>
            <Select onValueChange={setTipoTransacao}>
              <SelectTrigger className="h-10 cursor-pointer">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="cursor-pointer" value="venda">Venda</SelectItem>
                <SelectItem className="cursor-pointer" value="emprestimo">Empréstimo</SelectItem>
                <SelectItem className="cursor-pointer" value="doacao">Doação</SelectItem>
                <SelectItem className="cursor-pointer" value="aluguel">Aluguel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estado de conservação */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Estado de conservação</Label>
            <Select onValueChange={setEstadoConservacao}>
              <SelectTrigger className="h-10 cursor-pointer">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="cursor-pointer" value="novo">Novo</SelectItem>
                <SelectItem className="cursor-pointer" value="seminovo">Seminovo</SelectItem>
                <SelectItem className="cursor-pointer" value="usado">Usado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Upload de foto */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Adicione uma foto</Label>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-md border bg-neutral-100 grid place-items-center text-neutral-400">
                <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16" />
              </div>

              <div className="space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setFileName(f ? f.name : "");
                  }}
                />
                <Button
                  type="button"
                  className="cursor-pointer bg-[#1500FF] hover:bg-[#1200d6]"
                  onClick={() => fileRef.current?.click()}
                >
                  Upload
                </Button>
                {fileName && (
                  <p className="text-sm text-muted-foreground break-all">
                    Selecionado: {fileName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Botão grande "Anunciar" no final */}
          <div className="pt-2">
            <Button
              type="submit"
              className="cursor-pointer w-full sm:w-auto sm:min-w-56 h-11 text-base bg-[#1500FF] hover:bg-[#1200d6]"
            >
              Anunciar
            </Button>
          </div>

          {mensagem && (
            <p className="mt-4 text-sm text-green-600">{mensagem}</p>
          )}
        </form>
      </section>
    </div>
  );
}
