"use client";

import { useState } from "react";
import AdCard from "@/components/AdCard";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function FavoritasPage() {
  type AdItem = React.ComponentProps<typeof AdCard>["item"];

  const MOCK_ITEMS: AdItem[] = [
    {
      id: "favorito-1",
      href: "/produto/favorito-1",
      title: "Livro de Algoritmos",
      type: "Venda",
      price: "R$ 49,90",
      condition: "Novo",
      rating: 5,
      reviews: 12,
      image: "/images/livro.png",
    },
    {
      id: "favorito-2",
      href: "/produto/favorito-2",
      title: "Placa Arduino Uno",
      type: "Doação",
      condition: "Usado",
      rating: 4,
      reviews: 4,
      image: "/images/arduino.jpeg",
    },
  ];

  const [items, setItems] = useState<AdItem[]>(MOCK_ITEMS);

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="max-w-screen-lg w-full px-4 md:px-8 mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Favoritos</h1>

      {items.length === 0 && (
        <div className="text-center text-muted-foreground py-20">
          Você ainda não possui favoritos.
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="relative">
              <AdCard item={item} />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 w-6 h-6 p-0"
                onClick={() => handleRemove(item.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}