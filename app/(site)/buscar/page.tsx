// app/(site)/buscar/page.tsx
"use client";

import { useState, useEffect, ElementType } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Star, ImageIcon, ShoppingBag, Repeat2, Gift } from "lucide-react";
import Link from "next/link";

type Produto = {
  id: string;
  titulo: string;
  descricao: string;
  tipo_transacao: "VENDA" | "EMPRESTIMO" | "DOACAO";
  estado_conservacao: "NOVO" | "SEMINOVO" | "USADO";
  preco?: number; // Venda
  precoFormatado?: string;
  prazoDias?: number; // Empréstimo
  avaliacoes: number;
  rating?: number;
  imagem_url?: string;
  categoria: string;
};

type ApiProduto = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo_transacao: Produto["tipo_transacao"];
  estado_conservacao: Produto["estado_conservacao"];
  preco_centavos?: number | null;
  preco_formatado?: string | null;
  categoria?: { nome?: string | null } | null;
  imagens?: { url: string | null }[];
  avaliacoes?: { nota: number | null }[];
  prazo_dias?: number | null;
};

/* ---------- helpers ---------- */
const transactionLabel: Record<Produto["tipo_transacao"], string> = {
  VENDA: "Venda",
  EMPRESTIMO: "Empréstimo",
  DOACAO: "Doação",
};

const conditionLabel: Record<Produto["estado_conservacao"], string> = {
  NOVO: "Novo",
  SEMINOVO: "Seminovo",
  USADO: "Usado",
};

const transactionTextColor: Record<Produto["tipo_transacao"], string> = {
  VENDA: "text-red-600",
  EMPRESTIMO: "text-green-700",
  DOACAO: "text-indigo-700",
};

const transactionBorderColor: Record<Produto["tipo_transacao"], string> = {
  VENDA: "border-red-700",
  EMPRESTIMO: "border-green-700",
  DOACAO: "border-indigo-600",
};
type AdType = "VENDA" | "EMPRESTIMO" | "DOACAO";

const typeConfig: Record<AdType, { icon: ElementType; color: string }> = {
  VENDA: { icon: ShoppingBag, color: "#EC221F" },
  EMPRESTIMO: { icon: Repeat2, color: "#0A5C0A" },
  DOACAO: { icon: Gift, color: "#0B0B64" },
};

const formatPreco = (preco?: number, precoFormatado?: string) => {
  if (precoFormatado && precoFormatado.trim()) {
    return precoFormatado;
  }

  if (typeof preco === "number") {
    return preco.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  return "—";
};

const mapApiProduto = (item: ApiProduto): Produto => {
  const notas = (item.avaliacoes ?? [])
    .map((avaliacao) => (typeof avaliacao.nota === "number" ? avaliacao.nota : null))
    .filter((nota): nota is number => nota !== null && Number.isFinite(nota));

  const totalAvaliacoes = notas.length;
  const rating = totalAvaliacoes
    ? notas.reduce((total, nota) => total + nota, 0) / totalAvaliacoes
    : undefined;

  const precoCentavos =
    typeof item.preco_centavos === "number" ? item.preco_centavos : undefined;

  return {
    id: item.id,
    titulo: item.titulo,
    descricao: item.descricao ?? "",
    tipo_transacao: item.tipo_transacao,
    estado_conservacao: item.estado_conservacao,
    preco: typeof precoCentavos === "number" ? precoCentavos / 100 : undefined,
    precoFormatado: item.preco_formatado ?? undefined,
    prazoDias:
      typeof item.prazo_dias === "number" && Number.isFinite(item.prazo_dias)
        ? item.prazo_dias
        : undefined,
    avaliacoes: totalAvaliacoes,
    rating,
    imagem_url: item.imagens?.[0]?.url ?? undefined,
    categoria: item.categoria?.nome ?? "",
  };
};

/* ---------- página ---------- */
export default function BuscarPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);

  // query inicial vinda do header (?q=)
  const q = sp.get("q")?.toString() ?? "";
  const [query, setQuery] = useState(q);

  // filtros
  const initialTipo = sp.get("tipo")?.toUpperCase() ?? "";
  const initialEstado = sp.get("estado")?.toUpperCase() ?? "";
  const initialPreco = sp.get("preco") ?? "";

  const [tipo, setTipo] = useState<string>(initialTipo);
  const [estado, setEstado] = useState<string>(initialEstado);
  const [preco, setPreco] = useState<string>(initialPreco);     

  // paginação simples
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // manter URL sincronizada (sem recarregar)
  useEffect(() => {
    const params = new URLSearchParams(sp.toString());

    query ? params.set("q", query) : params.delete("q");
    tipo ? params.set("tipo", tipo) : params.delete("tipo");
    estado ? params.set("estado", estado) : params.delete("estado");
    preco ? params.set("preco", preco) : params.delete("preco");
    params.set("page", String(page));
    router.replace(`/buscar?${params.toString()}`);
  }, [query, tipo, estado, preco, page]);

  useEffect(() => {
    async function fetchProdutos() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (tipo) params.set("tipo", tipo);
        if (estado) params.set("estado", estado);
        if (preco) params.set("preco", preco);
        params.set("page", String(page));

        const res = await fetch(`/api/items?${params.toString()}`);
        if(!res.ok) throw new Error('Erro ao buscar produtos');
        const data = await res.json();
        const mapped = Array.isArray(data)
          ? data.map((item: ApiProduto) => mapApiProduto(item))
          : [];
        setProdutos(mapped);
      } catch (error) {
        console.error("Erro ao carregar produtos:",error);
        setProdutos([]);
      } finally {
        setLoading(false);
      }
    }

    if (query != undefined) fetchProdutos();
  }, [query, tipo, estado, preco, page]);

  const totalPages = 1
  const paginated = produtos;

  // reset página ao mudar filtros
  useEffect(() => { setPage(1); }, [query, tipo, estado, preco]);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-semibold mb-2">
        Resultados de: <span className="italic">“{q || query || "Todos"}”</span>
      </h1>

      {/* barra de filtros */}
      <div className="flex flex-wrap items-center gap-4 border-b pb-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Filtrar por:</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold">Tipo</span>
          <Select onValueChange={(v) => setTipo(v === "all" ? "" : v)} value={tipo || undefined}>
            <SelectTrigger className="h-9 w-44 cursor-pointer">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem className="cursor-pointer" value="all">Todos</SelectItem>
              <SelectItem className="cursor-pointer" value="VENDA">Venda</SelectItem>
              <SelectItem className="cursor-pointer" value="EMPRESTIMO">Empréstimo</SelectItem>
              <SelectItem className="cursor-pointer" value="DOACAO">Doação</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold">Estado de conservação</span>
          <Select onValueChange={(v) => setEstado(v === "all" ? "" : v)} value={estado || undefined}>
            <SelectTrigger className="h-9 w-48 cursor-pointer">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem className="cursor-pointer" value="all">Todos</SelectItem>
              <SelectItem className="cursor-pointer" value="NOVO">Novo</SelectItem>
              <SelectItem className="cursor-pointer" value="SEMINOVO">Seminovo</SelectItem>
              <SelectItem className="cursor-pointer" value="USADO">Usado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold">Preço</span>
          <Select onValueChange={(v) => setPreco(v === "any" ? "" : v)} value={preco || undefined}>
            <SelectTrigger className="h-9 w-40 cursor-pointer">
              <SelectValue placeholder="Qualquer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem className="cursor-pointer" value="any">Qualquer</SelectItem>
              <SelectItem className="cursor-pointer" value="0-50">até R$ 50</SelectItem>
              <SelectItem className="cursor-pointer" value="50-100">R$ 50–100</SelectItem>
              <SelectItem className="cursor-pointer" value="100+">R$ 100+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* listagem */}
      <div className="mt-6 space-y-6">
        {loading ? (
          <div className="text-center text-muted-foreground py-20">Carregando...</div>
        ) : produtos.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">
            Nada encontrado para <span className="font-medium">“{query}”</span>.
          </div>
        ) : (
          produtos.map((p) => <ResultItem key={p.id} p={p} />)
        )}
      </div>

      {/* paginação */}
      <div className="mt-8 flex items-center justify-center gap-2">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
          Anterior
        </Button>
        <span className="px-3 py-2 text-sm rounded-md border bg-white">{page} / {totalPages}</span>
        <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
          Próximo
        </Button>
      </div>
    </div>
  );
}

/* ---------- item do resultado (card largo) ---------- */
function ResultItem({ p }: { p: Produto }) {
  const borderColor =
    transactionBorderColor[p.tipo_transacao as keyof typeof transactionBorderColor] ||
    "border-gray-300";

  const cfg = typeConfig[p.tipo_transacao as AdType] ?? {
    icon: ShoppingBag,
    color: "#666",
  };

  const Icon = cfg.icon;
  const color = cfg.color;
  const ratingValue = Math.round(p.rating ?? 0);
  const avaliacoesLabel = `${p.avaliacoes} ${p.avaliacoes === 1 ? "avaliação" : "avaliações"}`;
  const transaction = transactionLabel[p.tipo_transacao] ?? p.tipo_transacao;
  const condition = conditionLabel[p.estado_conservacao] ?? p.estado_conservacao;

  return (
    <Link href={`/produto/${p.id}`} className="block hover:scale-[1.01] transition-transform">
      <Card className={`bg-white cursor-pointer hover:shadow-md border-1 ${borderColor}`}>
        <div className="flex gap-4 p-4 sm:p-6">
          {/* imagem */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-md border bg-neutral-100 grid place-items-center shrink-0 overflow-hidden">
            {p.imagem_url ? (
              <img
                src={p.imagem_url}
                alt={`Imagem do produto ${p.titulo}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <ImageIcon className="w-10 h-10 text-neutral-400" />
            )}
          </div>

          {/* conteúdo central */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold leading-tight">{p.titulo}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{p.descricao}</p>
              </div>
            </div>

            {/* preço / prazo / rating */}
            <div className="mt-3">
              {p.tipo_transacao === "VENDA" && (p.preco != null || p.precoFormatado) ? (
                <div className="text-xl font-bold">
                  {formatPreco(p.preco, p.precoFormatado)}
                </div>
              ) : null}

              {p.tipo_transacao === "EMPRESTIMO" && p.prazoDias ? (
                <div className="text-xl font-bold">{p.prazoDias} dias</div>
              ) : null}

              <div className="mt-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="flex text-yellow-500" aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < ratingValue ? "fill-current" : ""}
                      />
                    ))}
                  </div>
                  <span>{p.rating != null ? p.rating.toFixed(1) : "—"} de 5</span>
                </div>
                <div className="text-xs">{avaliacoesLabel}</div>
              </div>
            </div>
          </div>

          {/* coluna direita */}
          <div className="flex flex-col justify-between items-end w-28">
            <Badge
              className={`bg-transparent border text-base flex items-center gap-1 ${transactionTextColor[p.tipo_transacao]}`}
            >
              <Icon className="!w-5 !h-5" style={{ color }} />
              {transaction}
            </Badge>
            <span className="text-base font-bold">{condition}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
