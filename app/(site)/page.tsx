"use client";

/*Lógica de score “Recomendado”
Quando o front pede itens com ordenação “recomendado”, a API calcula um score somando quatro bônus: recência (anúncios novos ganham até +2), 
reputação do vendedor (média de avaliações mais um bônus que cresce com a contagem de reviews até +1), qualidade do anúncio (imagem principal, 
descrição longa e preço válido em vendas somam até +2,5) e engajamento (favoritos e interesses podem render até +3,5). 
Depois dessa soma, a lista é reordenada pelo score resultante; empates são desempates pela data de publicação mais recente.*/

import { useEffect, useMemo, useState, type ElementType } from "react";
import Link from "next/link";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, } from "@/components/ui/select";
import {
  Plus,
  Grid2X2,
  ShoppingCart,
  Heart,
  Smartphone,
  Cpu,
  Dumbbell,
  Guitar,
  BookOpen,
  Boxes,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdGridPager } from "@/components/AdCard";
import { mapItemToAd, type PrismaItemWithRelations } from "@/lib/ad-mapper";

interface Categoria {
  id: string;
  nome: string;
}

type FixedCategory = {
  key: string;
  nome: string;
  icon: ElementType;
};

const FIXED_CATEGORIES: FixedCategory[] = [
  { key: "celulares", nome: "Celulares", icon: Smartphone },
  { key: "eletronicos", nome: "Eletrônicos", icon: Cpu },
  { key: "esportes", nome: "Esportes", icon: Dumbbell },
  { key: "hobbies", nome: "Hobbies", icon: Guitar },
  { key: "livros", nome: "Livros", icon: BookOpen },
  { key: "outros", nome: "Outros", icon: Boxes },
];

const CATEGORY_NAME_TO_KEY: Record<string, string> = FIXED_CATEGORIES.reduce(
  (acc, category) => {
    acc[category.nome] = category.key;
    return acc;
  },
  {} as Record<string, string>,
);

const FALLBACK_CATEGORY_KEY = CATEGORY_NAME_TO_KEY["Outros"] ?? "";

type ApiItem = PrismaItemWithRelations & {
  categoria?: { id: string; nome: string } | null;
  _count?: { favoritos: number; interesses: number };
};

type SortOption = "recomendado" | "recentes" | "preco-asc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recomendado", label: "Recomendado" },
  { value: "recentes", label: "Mais recentes" },
  { value: "preco-asc", label: "Menor preço" },
];

const TRANSACTION_TO_API: Record<string, string> = {
  Venda: "VENDA",
  "Empréstimo": "EMPRESTIMO",
  Doação: "DOACAO",
};

const CONDITION_TO_API: Record<string, string> = {
  Novo: "NOVO",
  Seminovo: "SEMINOVO",
  Usado: "USADO",
};

export default function HomePage() {
  const categories = FIXED_CATEGORIES;
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoryIds, setCategoryIds] = useState<Record<string, string>>({});

  const [items, setItems] = useState<ApiItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState<string | null>(null);

  const [selectedCategoryKey, setSelectedCategoryKey] = useState("");
  const [tipo, setTipo] = useState("");
  const [estado, setEstado] = useState("");
  const [preco, setPreco] = useState("");
  const [sort, setSort] = useState<SortOption>("recomendado");

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        setCategoriesError(null);
        const response = await fetch("/api/categories", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Não foi possível carregar as categorias.");
        }

        const data = (await response.json()) as Categoria[];
        if (!active) {
          return;
        }

        const mappedIds: Record<string, string> = {};
        for (const apiCategory of data ?? []) {
          const key = CATEGORY_NAME_TO_KEY[apiCategory.nome];
          if (key) {
            mappedIds[key] = apiCategory.id;
          }
        }
        setCategoryIds(mappedIds);
      } catch (error) {
        console.error("Erro ao carregar categorias", error);
        if (!active) {
          return;
        }
        setCategoriesError(
          error instanceof Error
            ? error.message
            : "Erro inesperado ao carregar categorias.",
        );
      } finally {
        if (active) {
          setCategoriesLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      active = false;
    };
  }, []);

  const selectedCategoryId = useMemo(() => {
    if (!selectedCategoryKey) {
      return "";
    }
    return categoryIds[selectedCategoryKey] ?? "";
  }, [categoryIds, selectedCategoryKey]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadItems() {
      try {
        setItemsLoading(true);
        setItemsError(null);

        const params = new URLSearchParams();
        if (selectedCategoryId) params.set("categoriaId", selectedCategoryId);
        if (tipo) {
          const mapped = TRANSACTION_TO_API[tipo] ?? tipo;
          params.set("tipo", mapped);
        }
        if (estado) {
          const mapped = CONDITION_TO_API[estado] ?? estado;
          params.set("estado", mapped);
        }
        if (preco) params.set("preco", preco);
        params.set("ordenacao", sort);

        const queryString = params.toString();
        const response = await fetch(
          `/api/items${queryString ? `?${queryString}` : ""}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Não foi possível carregar os anúncios.");
        }

        const data = (await response.json()) as ApiItem[];

        if (!active) {
          return;
        }

        setItems(data ?? []);
      } catch (error) {
        if (controller.signal.aborted || !active) {
          return;
        }

        console.error("Erro ao carregar anúncios", error);
        setItemsError(
          error instanceof Error
            ? error.message
            : "Erro inesperado ao carregar anúncios.",
        );
        setItems([]);
      } finally {
        if (active) {
          setItemsLoading(false);
        }
      }
    }

    void loadItems();

    return () => {
      active = false;
      controller.abort();
    };
  }, [estado, preco, selectedCategoryId, sort, tipo]);

  const adItems = useMemo(() => items.map((item) => mapItemToAd(item)), [items]);

  const categoryKeyById = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(categoryIds).forEach(([key, id]) => {
      if (id) {
        map[id] = key;
      }
    });
    return map;
  }, [categoryIds]);

  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, typeof adItems> = {};
    for (const category of categories) {
      grouped[category.key] = [];
    }

    for (const item of adItems) {
      const keyFromId = item.categoryId ? categoryKeyById[item.categoryId] : undefined;
      const keyFromName = item.categoryName
        ? CATEGORY_NAME_TO_KEY[item.categoryName]
        : undefined;
      const resolvedKey = keyFromId ?? keyFromName ?? FALLBACK_CATEGORY_KEY;

      if (!resolvedKey) {
        continue;
      }

      if (!grouped[resolvedKey]) {
        grouped[resolvedKey] = [];
      }

      grouped[resolvedKey]!.push(item);
    }

    return grouped;
  }, [adItems, categories, categoryKeyById]);

  const hasItemsInCategories = useMemo(
    () =>
      categories.some(
        (category) => (itemsByCategory[category.key]?.length ?? 0) > 0,
      ),
    [categories, itemsByCategory],
  );

  const actions = [
    { label: "Novo Anúncio", href: "/anunciar/novo", icon: Plus },
    { label: "Meus Anúncios", href: "/meus-anuncios", icon: Grid2X2 },
    { label: "Meu Carrinho", href: "/carrinho", icon: ShoppingCart },
    { label: "Favoritos", href: "/favoritos", icon: Heart },
  ];

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategoryKey) {
      return "";
    }
    const match = categories.find((category) => category.key === selectedCategoryKey);
    return match?.nome ?? "";
  }, [categories, selectedCategoryKey]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Olá, Usuário</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="border bg-white rounded-lg p-3 flex flex-col items-center gap-1 hover:bg-neutral-100"
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm text-center">{label}</span>
          </Link>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Categorias</h2>
          {categoriesError ? (
            <span className="text-xs text-red-600">{categoriesError}</span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategoryKey === category.key;
            return (
              <button
                key={category.key}
                onClick={() =>
                  setSelectedCategoryKey((prev) =>
                    prev === category.key ? "" : category.key,
                  )
                }
                className={
                  `cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-2 transition-colors ${
                    isActive ? "bg-neutral-100" : "bg-white"
                  } hover:bg-neutral-100`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm text-center">{category.nome}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold">Anúncios</h2>
          {selectedCategoryName ? (
            <Badge variant="secondary">{selectedCategoryName}</Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-4 border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Filtrar por:</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold">Tipo</span>
            <Select
              onValueChange={(value) => setTipo(value === "all" ? "" : value)}
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
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold">Estado</span>
            <Select
              onValueChange={(value) => setEstado(value === "all" ? "" : value)}
              value={estado}
            >
              <SelectTrigger className="h-9 w-40 cursor-pointer">
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
              onValueChange={(value) => setPreco(value === "any" ? "" : value)}
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

          <div className="ml-auto flex items-center gap-2">
            <span className="font-semibold">Ordenar por</span>
            <Select onValueChange={(value) => setSort(value as SortOption)} value={sort}>
              <SelectTrigger className="h-9 w-44 cursor-pointer">
                <SelectValue placeholder="Ordenação" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    className="cursor-pointer"
                    value={option.value}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {itemsError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {itemsError}
          </div>
        ) : null}

        {itemsLoading ? (
          <div className="text-center text-muted-foreground py-20">
            Carregando anúncios...
          </div>
        ) : hasItemsInCategories ? (
          <div className="space-y-8">
            {categories.map((category) => {
              const categoryItems = itemsByCategory[category.key] ?? [];
              if (categoryItems.length === 0) {
                return null;
              }

              return (
                <div key={category.key} className="space-y-3">
                  <h3 className="text-xl font-semibold">{category.nome}</h3>
                  <AdGridPager
                    items={categoryItems}
                    maxPerPage={8}
                    gridClass="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-20">
            Nenhum anúncio encontrado.
          </div>
        )}
      </section>
    </div>
  );
}
