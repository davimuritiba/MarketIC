// app/(site)/buscar/page.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, ImageIcon } from "lucide-react";

/* ---------- MOCK (substituir por fetch no back depois) ---------- */
type Produto = {
  id: string;
  titulo: string;
  descricao: string;
  tipo: "Venda" | "Empréstimo" | "Doação" | "Aluguel";
  estado: "Novo" | "Seminovo" | "Usado";
  preco?: number;     // Venda/Aluguel
  prazoDias?: number; // Empréstimo
  avaliacoes?: number;
  rating?: number;
  categoria: string;
};

const PRODUTOS: Produto[] = [
  { id: "1", titulo: "Livro X", descricao: "Livro focado no aprendizado de x", tipo: "Venda", estado: "Novo", preco: 60, avaliacoes: 4, rating: 4.0, categoria: "Livros" },
  { id: "2", titulo: "Livro XY", descricao: "Livro focado no aprendizado de xy", tipo: "Empréstimo", estado: "Seminovo", prazoDias: 15, avaliacoes: 17, rating: 5.0, categoria: "Livros" },
  { id: "3", titulo: "Livro Z", descricao: "Livro focado no aprendizado de z", tipo: "Doação", estado: "Usado", avaliacoes: 9, rating: 4.5, categoria: "Livros" },
  { id: "4", titulo: "Livro X", descricao: "Outra edição do Livro X", tipo: "Venda", estado: "Usado", preco: 269.99, avaliacoes: 163, rating: 3.8, categoria: "Livros" },
  // adicione mais mocks se quiser
];

/* ---------- helpers ---------- */
const tipoColor: Record<Produto["tipo"], string> = {
  "Venda": "text-red-600",
  "Empréstimo": "text-green-700",
  "Doação": "text-indigo-700",
  "Aluguel": "text-amber-700",
};

const fmtPreco = (v?: number) => (typeof v === "number" ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—");

/* ---------- página ---------- */
export default function BuscarPage() {
  const sp = useSearchParams();
  const router = useRouter();

  // query inicial vinda do header (?q=)
  const q = sp.get("q")?.toString() ?? "";
  const [query, setQuery] = useState(q);

  // filtros
  const [tipo, setTipo] = useState<string>("");       // "", "Venda", "Empréstimo", ...
  const [estado, setEstado] = useState<string>("");   // "", "Novo", "Seminovo", "Usado"
  const [preco, setPreco] = useState<string>("");     // "", "0-50", "50-100", "100+"

  // paginação simples
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // manter URL sincronizada (sem recarregar)
  useEffect(() => {
    const params = new URLSearchParams(sp.toString());
    params.set("q", query);
    tipo ? params.set("tipo", tipo) : params.delete("tipo");
    estado ? params.set("estado", estado) : params.delete("estado");
    preco ? params.set("preco", preco) : params.delete("preco");
    params.set("page", String(page));
    router.replace(`/buscar?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, tipo, estado, preco, page]);

  const results = useMemo(() => {
    // texto (titulo/descrição/categoria)
    let arr = PRODUTOS.filter(p => {
      if (!query.trim()) return true;
      const text = `${p.titulo} ${p.descricao} ${p.categoria}`.toLowerCase();
      return text.includes(query.toLowerCase());
    });

    // filtros
    if (tipo) arr = arr.filter(p => p.tipo === tipo);
    if (estado) arr = arr.filter(p => p.estado === estado);

    if (preco) {
      if (preco === "0-50") arr = arr.filter(p => (p.preco ?? Infinity) >= 0 && (p.preco ?? Infinity) <= 50);
      if (preco === "50-100") arr = arr.filter(p => (p.preco ?? Infinity) > 50 && (p.preco ?? Infinity) <= 100);
      if (preco === "100+") arr = arr.filter(p => (p.preco ?? 0) > 100);
    }

    return arr;
  }, [query, tipo, estado, preco]);

  const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
  const paginated = results.slice((page - 1) * pageSize, page * pageSize);

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
          <Select onValueChange={(v) => setTipo(v)} value={tipo}>
            <SelectTrigger className="h-9 w-44 cursor-pointer">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="Venda">Venda</SelectItem>
              <SelectItem value="Empréstimo">Empréstimo</SelectItem>
              <SelectItem value="Doação">Doação</SelectItem>
              <SelectItem value="Aluguel">Aluguel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold">Estado de conservação</span>
          <Select onValueChange={(v) => setEstado(v)} value={estado}>
            <SelectTrigger className="h-9 w-48 cursor-pointer">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="Novo">Novo</SelectItem>
              <SelectItem value="Seminovo">Seminovo</SelectItem>
              <SelectItem value="Usado">Usado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold">Preço</span>
          <Select onValueChange={(v) => setPreco(v)} value={preco}>
            <SelectTrigger className="h-9 w-40 cursor-pointer">
              <SelectValue placeholder="Qualquer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Qualquer</SelectItem>
              <SelectItem value="0-50">até R$ 50</SelectItem>
              <SelectItem value="50-100">R$ 50–100</SelectItem>
              <SelectItem value="100+">R$ 100+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* pesquisa inline opcional (além do header) */}
        <div className="ml-auto flex items-center gap-2">
          <Input
            placeholder="Refinar busca..."
            className="w-64 h-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button variant="outline" onClick={() => setQuery("")}>Limpar</Button>
        </div>
      </div>

      {/* listagem */}
      <div className="mt-6 space-y-6">
        {paginated.map((p) => <ResultItem key={p.id} p={p} />)}

        {paginated.length === 0 && (
          <div className="text-center text-muted-foreground py-20">
            Nada encontrado para <span className="font-medium">“{query}”</span>.
          </div>
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
  return (
    <Card className="bg-white">
      <div className="flex gap-4 p-4 sm:p-6">
        {/* imagem */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-md border bg-neutral-100 grid place-items-center shrink-0">
          <ImageIcon className="w-10 h-10 text-neutral-400" />
        </div>

        {/* conteúdo central */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold leading-tight">{p.titulo}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{p.descricao}</p>
            </div>
            <Badge className={`bg-transparent border ${tipoColor[p.tipo]} ${/* só cor do texto */""}`}>
              {p.tipo}
            </Badge>
          </div>

          {/* preço / prazo / rating */}
          <div className="mt-3">
            {p.tipo === "Venda" || p.tipo === "Aluguel" ? (
              <div className="text-xl font-bold">{fmtPreco(p.preco)}</div>
            ) : p.tipo === "Empréstimo" ? (
              <div className="text-xl font-bold">{p.prazoDias} Dias</div>
            ) : null}

            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex text-yellow-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className={i < Math.round(p.rating ?? 0) ? "fill-current" : ""} />
                ))}
              </div>
              <span>{p.rating?.toFixed(1) ?? "—"} de 5</span>
              {p.avaliacoes ? <span className="text-xs">{p.avaliacoes} avaliações</span> : null}
            </div>
          </div>
        </div>

        {/* coluna direita: estado */}
        <div className="hidden sm:flex items-center justify-end w-28">
          <span className="text-sm font-semibold text-neutral-700">{p.estado}</span>
        </div>
      </div>
    </Card>
  );
}
