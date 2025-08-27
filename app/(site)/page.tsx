"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Plus,
  Grid2X2,
  ClipboardList,
  Heart,
  BookOpen,
  Cpu,
  ImageIcon,
} from "lucide-react";

// ---------- Tipos e mocks ----------
type Produto = {
  id: string;
  titulo: string;
  descricao: string;
  tipo: "Venda" | "Empréstimo" | "Doação" | "Aluguel";
  estado: "Novo" | "Seminovo" | "Usado";
  preco?: number;
  prazoDias?: number;
  categoria: string;
};

const PRODUTOS: Produto[] = [
  {
    id: "1",
    titulo: "Impressora Multifuncional HP Smart Tank",
    descricao: "Impressora com tanque de tinta integrado",
    tipo: "Venda",
    estado: "Usado",
    preco: 819,
    categoria: "Eletrônicos",
  },
  {
    id: "2",
    titulo: "Livro James Stewart Cálculo",
    descricao: "Livro base para cálculo",
    tipo: "Empréstimo",
    estado: "Usado",
    prazoDias: 120,
    categoria: "Livros",
  },
  {
    id: "3",
    titulo: "Placa Arduino Uno R3",
    descricao: "Placa Arduino com cabo USB",
    tipo: "Doação",
    estado: "Usado",
    categoria: "Eletrônicos",
  },
  {
    id: "4",
    titulo: "Memória ddr3 4gb",
    descricao: "Memória computador",
    tipo: "Doação",
    estado: "Usado",
    categoria: "Eletrônicos",
  },
  {
    id: "5",
    titulo: "Livro de Algoritmos",
    descricao: "Introdução à teoria dos algoritmos",
    tipo: "Venda",
    estado: "Novo",
    preco: 100,
    categoria: "Livros",
  },
];

const tipoColor: Record<Produto["tipo"], string> = {
  Venda: "text-red-600",
  "Empréstimo": "text-green-700",
  Doação: "text-indigo-700",
  Aluguel: "text-amber-700",
};

const fmtPreco = (v?: number) =>
  typeof v === "number"
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";

// ---------- Página ----------
export default function HomePage() {
  const categorias = Array.from(new Set(PRODUTOS.map((p) => p.categoria)));

  const [catFilter, setCatFilter] = useState("");
  const [tipo, setTipo] = useState("");
  const [estado, setEstado] = useState("");
  const [preco, setPreco] = useState("");

  const results = useMemo(() => {
    let arr = [...PRODUTOS];
    if (catFilter) arr = arr.filter((p) => p.categoria === catFilter);
    if (tipo) arr = arr.filter((p) => p.tipo === tipo);
    if (estado) arr = arr.filter((p) => p.estado === estado);
    if (preco) {
      if (preco === "0-50") arr = arr.filter((p) => (p.preco ?? Infinity) <= 50);
      if (preco === "50-100")
        arr = arr.filter(
          (p) => (p.preco ?? Infinity) > 50 && (p.preco ?? Infinity) <= 100
        );
      if (preco === "100+") arr = arr.filter((p) => (p.preco ?? 0) > 100);
    }
    return arr;
  }, [catFilter, tipo, estado, preco]);

  const grouped = useMemo(() => {
    return results.reduce((acc, p) => {
      (acc[p.categoria] ||= []).push(p);
      return acc;
    }, {} as Record<string, Produto[]>);
  }, [results]);

  const actions = [
    { label: "Novo Anúncio", href: "/anunciar/novo", icon: Plus },
    { label: "Meus Anúncios", href: "/meus-anuncios", icon: Grid2X2 },
    { label: "Solicitações", href: "/solicitacoes", icon: ClipboardList },
    { label: "Favoritas", href: "/favoritas", icon: Heart },
  ];

  const catIcons: Record<string, React.ElementType> = {
    Livros: BookOpen,
    "Eletrônicos": Cpu,
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Olá, Usuário</h1>

      {/* ações rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {actions.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="border bg-neutral-100 rounded-lg p-4 flex flex-col items-center gap-2 hover:bg-neutral-200"
          >
            <Icon className="w-5 h-5" />
            <span className="text-sm text-center">{label}</span>
          </Link>
        ))}
      </div>

      {/* categorias */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Categorias</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categorias.map((c) => {
            const Icon = catIcons[c as keyof typeof catIcons];
            return (
              <button
                key={c}
                onClick={() => setCatFilter(catFilter === c ? "" : c)}
                className={`border rounded-lg p-4 flex flex-col items-center gap-2 hover:bg-neutral-200 ${
                  catFilter === c ? "bg-neutral-200" : "bg-neutral-100"
                }`}
              >
                {Icon && <Icon className="w-5 h-5" />}
                <span className="text-sm">{c}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* anúncios */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Anúncios</h2>

        {/* barra de filtros (sem categoria) */}
        <div className="flex flex-wrap items-center gap-4 border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Filtrar por:</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold">Tipo</span>
            <Select
              onValueChange={(v) => setTipo(v === "all" ? "" : v)}
              value={tipo}
            >
              <SelectTrigger className="h-9 w-44 cursor-pointer">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="cursor-pointer" value="all">
                  Todos
                </SelectItem>
                <SelectItem className="cursor-pointer" value="Venda">
                  Venda
                </SelectItem>
                <SelectItem className="cursor-pointer" value="Empréstimo">
                  Empréstimo
                </SelectItem>
                <SelectItem className="cursor-pointer" value="Doação">
                  Doação
                </SelectItem>
                <SelectItem className="cursor-pointer" value="Aluguel">
                  Aluguel
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold">Estado de conservação</span>
            <Select
              onValueChange={(v) => setEstado(v === "all" ? "" : v)}
              value={estado}
            >
              <SelectTrigger className="h-9 w-48 cursor-pointer">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="cursor-pointer" value="all">
                  Todos
                </SelectItem>
                <SelectItem className="cursor-pointer" value="Novo">
                  Novo
                </SelectItem>
                <SelectItem className="cursor-pointer" value="Seminovo">
                  Seminovo
                </SelectItem>
                <SelectItem className="cursor-pointer" value="Usado">
                  Usado
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold">Preço</span>
            <Select
              onValueChange={(v) => setPreco(v === "any" ? "" : v)}
              value={preco}
            >
              <SelectTrigger className="h-9 w-40 cursor-pointer">
                <SelectValue placeholder="Qualquer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="cursor-pointer" value="any">
                  Qualquer
                </SelectItem>
                <SelectItem className="cursor-pointer" value="0-50">
                  até R$ 50
                </SelectItem>
                <SelectItem className="cursor-pointer" value="50-100">
                  R$ 50–100
                </SelectItem>
                <SelectItem className="cursor-pointer" value="100+">
                  R$ 100+
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* listagem dividida por categorias */}
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="mt-6">
            <h3 className="text-xl font-semibold mb-3">{cat}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <ProdutoCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        ))}

        {results.length === 0 && (
          <div className="text-center text-muted-foreground py-20">
            Nenhum anúncio encontrado.
          </div>
        )}
      </section>
    </div>
  );
}

// ---------- Card de produto ----------
function ProdutoCard({ p }: { p: Produto }) {
  return (
    <Card className="bg-white">
      <CardContent className="p-4 space-y-3">
        <div className="w-full h-40 rounded-md border bg-neutral-100 grid place-items-center">
          <ImageIcon className="w-10 h-10 text-neutral-400" />
        </div>
        <Badge
          variant="outline"
          className={`border-current ${tipoColor[p.tipo]}`}
        >
          {p.tipo}
        </Badge>
        <h4 className="font-semibold leading-tight">{p.titulo}</h4>
        <p className="text-sm text-muted-foreground line-clamp-2">{p.descricao}</p>
        <div className="flex items-center justify-between text-sm">
          {p.preco ? <span className="font-semibold">{fmtPreco(p.preco)}</span> : p.prazoDias ? (
            <span>{p.prazoDias} Dias</span>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">{p.estado}</span>
        </div>
      </CardContent>
    </Card>
  );
}