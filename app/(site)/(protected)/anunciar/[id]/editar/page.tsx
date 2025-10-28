"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";

import { LoadingOverlay } from "@/components/loading-overlay";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface CategoriaOption {
  id: string;
  nome: string;
  slug?: string | null;
}

type EditableImage =
  | { kind: "existing"; id: string; url: string }
  | { kind: "new"; id: string; file: File; preview: string };

function createTempId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export default function EditarAnuncioPage() {
  const params = useParams<{ id: string }>();
  const itemIdRaw = params?.id;
  const itemId = Array.isArray(itemIdRaw) ? itemIdRaw[0] : itemIdRaw;
  const router = useRouter();

  const fileRef = useRef<HTMLInputElement | null>(null);
  const previewsRef = useRef<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [categorias, setCategorias] = useState<CategoriaOption[]>([]);
  const [carregandoCategorias, setCarregandoCategorias] = useState(true);
  const [erroCategorias, setErroCategorias] = useState<string | null>(null);
  const [tipoTransacao, setTipoTransacao] = useState("");
  const [estadoConservacao, setEstadoConservacao] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [selectedImages, setSelectedImages] = useState<EditableImage[]>([]);
  const [preco, setPreco] = useState<string>("");
  const [precoCentavos, setPrecoCentavos] = useState<number | null>(null);

  const [mensagemErro, setMensagemErro] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    previewsRef.current = selectedImages
      .filter((imagem): imagem is Extract<EditableImage, { kind: "new" }> => imagem.kind === "new")
      .map((imagem) => imagem.preview);
  }, [selectedImages]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((preview) => URL.revokeObjectURL(preview));
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

        const data = (await res.json()) as CategoriaOption[];
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

  useEffect(() => {
    async function carregarAnuncio() {
      if (!itemId) {
        setInitialError("Anúncio não encontrado.");
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/items/${itemId}`);
        if (!res.ok) {
          let message = "Não foi possível carregar o anúncio.";
          try {
            const data = await res.json();
            if (typeof data?.error === "string" && data.error.trim()) {
              message = data.error;
            }
          } catch (error) {
            const text = await res.text();
            if (text.trim()) {
              message = text;
            }
          }
          throw new Error(message);
        }

        const item = await res.json();

        setTitulo(item.titulo ?? "");
        setDescricao(item.descricao ?? "");
        setCategoria(item.categoria?.nome ?? "");
        setTipoTransacao((item.tipo_transacao ?? "").toLowerCase());
        setEstadoConservacao((item.estado_conservacao ?? "").toLowerCase());
        setQuantidade(String(item.quantidade_disponivel ?? "1"));

        if (item.tipo_transacao === "VENDA") {
          if (typeof item.preco_formatado === "string" && item.preco_formatado.trim()) {
            setPreco(item.preco_formatado);
          } else if (typeof item.preco_centavos === "number") {
            const valor = item.preco_centavos / 100;
            setPreco(
              new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(valor),
            );
          }
          setPrecoCentavos(item.preco_centavos ?? null);
        } else {
          setPreco("");
          setPrecoCentavos(null);
        }

        const imagensOrdenadas: EditableImage[] = Array.isArray(item.imagens)
          ? item.imagens
              .slice()
              .sort((a: { ordem?: number }, b: { ordem?: number }) => (a?.ordem ?? 0) - (b?.ordem ?? 0))
              .map((imagem: { id: string; url: string }) => ({
                kind: "existing" as const,
                id: imagem.id,
                url: imagem.url,
              }))
          : [];

        setSelectedImages(imagensOrdenadas);
        setInitialError(null);
      } catch (error) {
        console.error("Erro ao carregar anúncio", error);
        setInitialError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o anúncio.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void carregarAnuncio();
  }, [itemId]);

  const handlePrecoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, "");
    if (!digits) {
      setPreco("");
      setPrecoCentavos(null);
      return;
    }

    const valor = Number(digits) / 100;
    setPrecoCentavos(Math.round(valor * 100));
    setPreco(
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
        valor,
      ),
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
            "Erro ao ler o arquivo selecionado. Por favor, tente novamente.",
          ),
        );
      };
      reader.readAsDataURL(file);
    });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    const novosArquivos = files.map((file) => ({
      kind: "new" as const,
      id: createTempId(),
      file,
      preview: URL.createObjectURL(file),
    }));

    setSelectedImages((prev) => [...prev, ...novosArquivos]);

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const handlePreviewClick = (previewUrl: string) => {
    const newWindow = window.open(previewUrl, "_blank", "noopener,noreferrer");
    if (newWindow) {
      newWindow.opener = null;
    }
  };

  const moveImage = (fromIndex: number, direction: number) => {
    setSelectedImages((prev) => {
      const newIndex = fromIndex + direction;
      if (newIndex < 0 || newIndex >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(newIndex, 0, moved);
      return next;
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setSelectedImages((prev) => {
      const imagem = prev[indexToRemove];
      if (imagem?.kind === "new") {
        URL.revokeObjectURL(imagem.preview);
      }
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMensagemErro("");

    if (!itemId) {
      setMensagemErro("Anúncio não encontrado.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (!titulo.trim()) throw new Error("Título é obrigatório.");
      if (!tipoTransacao) throw new Error("Selecione o tipo de transação.");
      if (!categoria.trim()) throw new Error("Selecione uma categoria.");
      if (!estadoConservacao) throw new Error("Selecione o estado de conservação.");

      const quantidadeNormalizada = Number.parseInt(quantidade, 10);

      if (
        !Number.isFinite(quantidadeNormalizada) ||
        quantidadeNormalizada < 1
      ) {
        throw new Error("Informe uma quantidade válida.");
      }

      if (!selectedImages.length) {
        throw new Error("Adicione pelo menos uma foto do anúncio.");
      }

      if (tipoTransacao === "venda") {
        if (precoCentavos == null || precoCentavos < 0) {
          throw new Error("Informe um preço válido.");
        }
      }

      const imagensPayload = await Promise.all(
        selectedImages.map(async (imagem, ordem) => {
          if (imagem.kind === "new") {
            const base64 = await convertFileToBase64(imagem.file);
            return { url: base64, ordem };
          }
          return { id: imagem.id, url: imagem.url, ordem };
        }),
      );

      const tipoTransacaoUpper = tipoTransacao.toUpperCase();
      const estadoConservacaoUpper = estadoConservacao.toUpperCase();

      const response = await fetch(`/api/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          descricao,
          tipo_transacao: tipoTransacaoUpper,
          estado_conservacao: estadoConservacaoUpper,
          preco_formatado: tipoTransacaoUpper === "VENDA" ? preco : null,
          preco_centavos:
            tipoTransacaoUpper === "VENDA" ? precoCentavos : null,
          quantidade_disponivel: quantidadeNormalizada,
          categoria_nome: categoria,
          imagens: imagensPayload,
        }),
      });

      if (!response.ok) {
        let message = "Não foi possível atualizar o anúncio.";
        try {
          const data = await response.json();
          if (typeof data?.error === "string" && data.error.trim()) {
            message = data.error;
          }
        } catch (error) {
          const text = await response.text();
          if (text.trim()) {
            message = text;
          }
        }
        throw new Error(message);
      }

      router.push(`/produto/${itemId}`);
    } catch (error) {
      setMensagemErro(
        error instanceof Error ? error.message : "Não foi possível atualizar o anúncio.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-screen-xl flex-col gap-4 px-4 py-10">
        <p className="text-lg text-muted-foreground">Carregando anúncio...</p>
      </div>
    );
  }

  if (initialError) {
    return (
      <div className="mx-auto flex max-w-screen-xl flex-col gap-4 px-4 py-10">
        <h1 className="text-3xl font-semibold">Editar Anúncio</h1>
        <p className="text-red-500">{initialError}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
      <LoadingOverlay
        isOpen={isSubmitting}
        message="Salvando alterações do anúncio..."
      />
      <h1 className="mb-6 text-3xl font-semibold">Editar Anúncio</h1>

      <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-6 md:p-8">
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="titulo" className="text-base font-semibold">
              Título
            </Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              placeholder="Adicione um título"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao" className="text-base font-semibold">
              Descrição
            </Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              placeholder="Adicione uma descrição"
              className="min-h-[96px]"
            />
          </div>

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

          <div className="space-y-2">
            <Label className="text-base font-semibold">Tipo de transação</Label>
            <Select value={tipoTransacao} onValueChange={setTipoTransacao}>
              <SelectTrigger className="h-10 cursor-pointer">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="cursor-pointer" value="venda">
                  Venda
                </SelectItem>
                <SelectItem className="cursor-pointer" value="emprestimo">
                  Empréstimo
                </SelectItem>
                <SelectItem className="cursor-pointer" value="doacao">
                  Doação
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tipoTransacao === "venda" && (
            <div className="space-y-2">
              <Label htmlFor="preco" className="text-base font-semibold">
                Selecione o preço
              </Label>
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

          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Estado de conservação
            </Label>
            <Select
              value={estadoConservacao}
              onValueChange={setEstadoConservacao}
            >
              <SelectTrigger className="h-10 cursor-pointer">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="cursor-pointer" value="novo">
                  Novo
                </SelectItem>
                <SelectItem className="cursor-pointer" value="seminovo">
                  Seminovo
                </SelectItem>
                <SelectItem className="cursor-pointer" value="usado">
                  Usado
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              className="inline-block h-10 w-30"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Fotos do anúncio</Label>

            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
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
              </div>
            </div>

            {selectedImages.length > 0 && (
              <div className="space-y-2">
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {selectedImages.map((imagem, index) => {
                    const previewUrl = imagem.kind === "new" ? imagem.preview : imagem.url;
                    return (
                      <li key={imagem.id} className="space-y-2">
                        <button
                          type="button"
                          onClick={() => handlePreviewClick(previewUrl)}
                          className="group relative block aspect-square w-full overflow-hidden rounded-md border focus:outline-none focus:ring-2 focus:ring-[#1500FF] focus:ring-offset-2"
                        >
                          <img
                            src={previewUrl}
                            alt={`Pré-visualização da imagem ${index + 1}`}
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                          <span className="sr-only">Abrir imagem completa</span>
                        </button>
                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => moveImage(index, -1)}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-4 w-4" />
                              <span className="sr-only">Mover para cima</span>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => moveImage(index, 1)}
                              disabled={index === selectedImages.length - 1}
                            >
                              <ChevronDown className="h-4 w-4" />
                              <span className="sr-only">Mover para baixo</span>
                            </Button>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-8 px-2 cursor-pointer"
                            onClick={() => handleRemoveImage(index)}
                          >
                            Remover
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <p className="text-xs text-muted-foreground">
                  Clique na imagem para abrir em tamanho completo e use as setas para reordenar.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="h-11 w-full cursor-pointer bg-[#1500FF] text-base hover:bg-[#1200d6] sm:w-auto sm:min-w-56"
              disabled={isSubmitting}
            >
              Salvar alterações
            </Button>
          </div>

          {mensagemErro && (
            <p className="mt-4 text-sm text-red-600">{mensagemErro}</p>
          )}
        </form>
      </section>
    </div>
  );
}
