"use client";

import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function NovoAnuncioPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [categorias, setCategorias] = useState<{ id: string; nome: string; slug?: string | null }[]>([]);
  const [carregandoCategorias, setCarregandoCategorias] = useState(true);
  const [erroCategorias, setErroCategorias] = useState<string | null>(null);
  const [tipoTransacao, setTipoTransacao] = useState("");
  const [estadoConservacao, setEstadoConservacao] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  type PreviewFile = {
    file: File;
    preview: string;
  };

  const [selectedFiles, setSelectedFiles] = useState<PreviewFile[]>([]);
  const [mensagem, setMensagem] = useState("");

  const previewsRef = useRef<PreviewFile[]>([]);

  useEffect(() => {
    previewsRef.current = selectedFiles;
  }, [selectedFiles]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, []);

  useEffect(() => {
    async function carregarCategorias() {
      try {
        setCarregandoCategorias(true);
        const res = await fetch("/api/categories");
        if (!res.ok) {
          throw new Error(await res.text());
        }

        const data = (await res.json()) as {
          id: string;
          nome: string;
          slug?: string | null;
        }[];

        setCategorias(data);
        setErroCategorias(null);
      } catch (error) {
        console.error("Erro ao carregar categorias", error);
        setErroCategorias("Não foi possível carregar as categorias.");
      } finally {
        setCarregandoCategorias(false);
      }
    }

    void carregarCategorias();
  }, []);

  // Exibição (R$ x) e valor salvo (centavos)
  const [preco, setPreco] = useState<string>("");
  const [precoCentavos, setPrecoCentavos] = useState<number | null>(null);

  // formata o valor em R$ e guarda centavos para o backend
  const handlePrecoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, ""); // mantém só números
    if (!digits) {
      setPreco("");
      setPrecoCentavos(null);
      return;
    }
    const valor = Number(digits) / 100; // últimos 2 dígitos são centavos
    setPrecoCentavos(Math.round(valor * 100));
    setPreco(
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor)
    );
  };

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
            "Erro ao ler o arquivo selecionado. Por favor, tente novamente."
          )
        );
      };
      reader.readAsDataURL(file);
    });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMensagem("");

    try {
      if (!titulo.trim()) throw new Error("Título é obrigatório.");
      if (!tipoTransacao) throw new Error("Selecione o tipo de transação.");
      if (!categoria) {
        throw new Error("Selecione uma categoria.");
      }
      if (!estadoConservacao) {
        throw new Error("Selecione o estado de conservação.");
      }
      if (tipoTransacao === "venda" && (precoCentavos == null || precoCentavos < 0)) {
        throw new Error("Informe um preço válido.");
      }
      const quantidadeNormalizada = Number.parseInt(quantidade, 10);
      if (!Number.isFinite(quantidadeNormalizada) || quantidadeNormalizada < 1) {
        throw new Error("Informe uma quantidade válida.");
      }
      if (!selectedFiles.length) {
        throw new Error("Adicione pelo menos uma foto do anúncio.");
      }

      const imagensBase64 = await Promise.all(
        selectedFiles.map(({ file }) => convertFileToBase64(file))
      );

      const imagens = imagensBase64
        .map((imagem) => imagem.trim())
        .filter((imagem) => imagem.length > 0);

      if (!imagens.length) {
        throw new Error(
          "Não foi possível processar as fotos selecionadas. Tente novamente."
        );
      }

      const tipoTransacaoUpper = tipoTransacao.toUpperCase();
      const estadoConservacaoUpper = estadoConservacao.toUpperCase();

      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          descricao,
          tipo_transacao: tipoTransacaoUpper, // backend espera em MAIÚSCULO
          estado_conservacao: estadoConservacaoUpper,
          preco_formatado: tipoTransacaoUpper === "VENDA" ? preco : null,
          preco_centavos:
            tipoTransacaoUpper === "VENDA" ? precoCentavos : null,
          quantidade_disponivel: quantidadeNormalizada,
          categoria_nome: categoria,
          imagens,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Erro ao criar o anúncio");
      }

      setMensagem("Anúncio criado com sucesso!");
      // limpa form
      setTitulo("");
      setDescricao("");
      setCategoria("");
      setTipoTransacao("");
      setEstadoConservacao("");
      setQuantidade("1");
      setSelectedFiles((prev) => {
        prev.forEach((file) => URL.revokeObjectURL(file.preview));
        return [];
      });
      if (fileRef.current) {
        fileRef.current.value = "";
      }
      setPreco("");
      setPrecoCentavos(null);
    } catch (err: any) {
      setMensagem(err?.message || "Erro ao criar o anúncio.");
    } 
  }


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }
    const filesWithPreview = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setSelectedFiles((prev) => [...prev, ...filesWithPreview]);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => {
      const fileToRemove = prev[indexToRemove];
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const handlePreviewClick = (previewUrl: string) => {
    const newWindow = window.open(previewUrl, "_blank", "noopener,noreferrer");
    if (newWindow) {
      newWindow.opener = null;
    }
  };

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
            <Select
              value={categoria}
              onValueChange={setCategoria}
              disabled={carregandoCategorias || !!erroCategorias}
            >
              <SelectTrigger className="h-10 cursor-pointer">
                <SelectValue
                  placeholder={
                    carregandoCategorias
                      ? "Carregando categorias..."
                      : "Selecione uma categoria"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((cat) => (
                  <SelectItem
                    key={cat.id}
                    className="cursor-pointer"
                    value={cat.nome}
                  >
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {erroCategorias && (
              <p className="text-sm text-red-500">{erroCategorias}</p>
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
              </SelectContent>
            </Select>
          </div>

          {/* Campo de preço se for venda */}
          {tipoTransacao === "venda" && (
            <div className="space-y-2">
              <Label htmlFor="preco" className="text-base font-semibold">Selecione o preço</Label>
              <Input
                id="preco"
                type="text"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={preco}
                onChange={handlePrecoChange}
                className="h-10"
              />
            </div>
          )}

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

          {/* Quantidade disponível */}
          <div className="space-y-2">
            <Label htmlFor="quantidade" className="text-base font-semibold">
              Quantidade disponível
            </Label>
            <Input
              id="quantidade"
              type="number"
              min={1}
              step={1}
              value={quantidade}
              onChange={(event) => setQuantidade(event.target.value)}
              placeholder="1"
              className="h-10 inline-block w-30"
            />
          </div>

          {/* Upload de foto */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Adicione uma foto</Label>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">

              <div className="space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  className="cursor-pointer bg-[#1500FF] hover:bg-[#1200d6]"
                  onClick={() => fileRef.current?.click()}
                >
                  Upload
                </Button>
                {selectedFiles.length > 0 && (
                  <div className="space-y-2 w-full">
                    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {selectedFiles.map(({ file, preview }, index) => (
                        <li key={`${preview}-${index}`} className="space-y-2">
                          <button
                            type="button"
                            onClick={() => handlePreviewClick(preview)}
                            className="group relative block w-full overflow-hidden rounded-md border aspect-square focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1500FF]"
                          >
                            <img
                              src={preview}
                              alt={`Pré-visualização da imagem ${index + 1}`}
                              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                            <span className="sr-only">Abrir imagem completa</span>
                          </button>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex-1 truncate" title={file.name}>
                              {file.name}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-8 px-2 text-xs cursor-pointer"
                              onClick={() => handleRemoveFile(index)}
                            >
                              Remover
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground">Clique na imagem para abrir em tamanho completo.</p>
                  </div>
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
