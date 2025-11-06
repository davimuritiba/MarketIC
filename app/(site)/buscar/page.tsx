// app/(site)/buscar/page.tsx
"use client";

import { useMemo, useState, useEffect, ElementType } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Star, ImageIcon, ShoppingBag, Repeat2, Gift } from "lucide-react";
import Link from "next/link";

/* ---------- (substituir por fetch no back depois) ---------- */
type Produto = {
  id: string;
  titulo: string;
  descricao: string;
  tipo_transacao: "VENDA" | "EMPRESTIMO" | "DOACAO" | "ALUGUEL";
  estado_conservacao: "Novo" | "Seminovo" | "Usado";
  preco?: number;     // Venda/Aluguel
  prazoDias?: number; // Empréstimo
  avaliacoes?: number;
  rating?: number;
  categoria: string;
};

/* ---------- helpers ---------- */
const tipoColor: Record<Produto["tipo_transacao"], string> = {
  "VENDA": "text-red-600",
  "EMPRESTIMO": "text-green-700",
  "DOACAO": "text-indigo-700",
  "ALUGUEL": "text-amber-700",
};
type AdType = "VENDA" | "EMPRESTIMO" | "DOACAO" | "ALUGUEL";

const typeConfig: Record<AdType, { icon: ElementType; color: string }> = {
  VENDA: { icon: ShoppingBag, color: "#EC221F" },
  EMPRESTIMO: { icon: Repeat2, color: "#0A5C0A" },
  DOACAO: { icon: Gift, color: "#0B0B64" },
  ALUGUEL: { icon: ImageIcon, color: "#A65E2E" },
};


const fmtPreco = (v?: number) => (typeof v === "number" ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—");

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
  const [tipo, setTipo] = useState<string>("");       
  const [estado, setEstado] = useState<string>("");   
  const [preco, setPreco] = useState<string>("");     

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
  }, [query, tipo, estado, preco, page]);

  useEffect(() => {
    async function fetchProdutos() {
      try {
        setLoading(true);
        const res = await fetch(`/api/items?q=${encodeURIComponent(query)}&page=${page}`);
        if(!res.ok) throw new Error('Erro ao buscar produtos');
        const data = await res.json();
        console.log("DADOS RECEBIDOS DA API:", data);
        setProdutos(data);
      } catch (error) {
        console.error("Erro ao carregar produtos:",error);
        setProdutos([]);
      } finally {
        setLoading(false);
      }
    }

    if (query != undefined) fetchProdutos();
  }, [query, page]);

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
          <Select onValueChange={(v) => setTipo(v === "all" ? "" : v)} value={tipo}>
            <SelectTrigger className="h-9 w-44 cursor-pointer">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem className="cursor-pointer" value="all">Todos</SelectItem>
              <SelectItem className="cursor-pointer" value="Venda">Venda</SelectItem>
              <SelectItem className="cursor-pointer" value="Empréstimo">Empréstimo</SelectItem>
              <SelectItem className="cursor-pointer" value="Doação">Doação</SelectItem>
              <SelectItem className="cursor-pointer" value="Aluguel">Aluguel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold">Estado de conservação</span>
          <Select onValueChange={(v) => setEstado(v === "all" ? "" : v)} value={estado}>
            <SelectTrigger className="h-9 w-48 cursor-pointer">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem className="cursor-pointer" value="all">Todos</SelectItem>
              <SelectItem className="cursor-pointer" value="Novo">Novo</SelectItem>
              <SelectItem className="cursor-pointer" value="Seminovo">Seminovo</SelectItem>
              <SelectItem className="cursor-pointer" value="Usado">Usado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold">Preço</span>
          <Select onValueChange={(v) => setPreco(v === "any" ? "" : v)} value={preco}>
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
  console.log("Valor de p.tipo:", p.tipo_transacao);

  const borderColor = tipoColor[p.tipo_transacao as keyof typeof tipoColor] || 'border-gray-300';

  console.log("Tipo:", p.tipo_transacao);
  console.log("Cor da borda:", borderColor);

  const cfg = typeConfig[p.tipo_transacao as AdType] ?? {
    icon: ShoppingBag,
    color: "#666",
  };

  const Icon = cfg.icon;
  const color = cfg.color;
  
  return (
    <Link href={`/produto/${p.id}`} className="block hover:scale-[1.01] transition-transform"> 
      <Card className={`bg-white cursor-pointer hover:shadow-md border-4 ${borderColor}`}>
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
            </div>

            {/* preço / prazo / rating */}
            <div className="mt-3">
              {p.tipo_transacao === "VENDA" || p.tipo_transacao === "ALUGUEL" ? (
                <div className="text-xl font-bold">{fmtPreco(p.preco)}</div>
                // ================================ ARRUMAR =================================
              ) //: p.tipo_transacao === "EMPRESTIMO" ? (
               // <div className="text-xl font-bold">{p.prazoDias} Dias</div> )
               : null}

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

          {/* coluna direita */}
          <div className="flex flex-col justify-between items-end w-28">
            <Badge className={`bg-transparent border text-base ${tipoColor[p.tipo_transacao]}`}>
              <Icon className="!w-5 !h-5" style={{ color }} />
              {p.tipo_transacao}
            </Badge>
            <span className="text-base font-bold">{p.estado_conservacao}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
