"use client";

import { Star, ShoppingBag, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage, } from "@/components/ui/avatar";
import { useState } from "react";

export default function ProdutoPage({ params }: { params: { id: string } }) {
  const stars = Array.from({ length: 5 });
  const reviews = [
    {
      name: "João",
      rating: 5,
      title: "Livro muito bom",
      comment: "Uma boa leitura, recomendo",
      date: "14/02/2025",
    },
    {
      name: "Maria",
      rating: 2,
      title: "Poderia ser melhor",
      comment: "Gostei mas muito difícil",
      date: "10/10/2024",
    },
  ];
  const avgRating =
    reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
  const itemCount = 10;
  const condition = "Novo";
  const type = "Venda";
  const [interested, setInterested] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [favorited, setFavorited] = useState(false);
  return (
    <div className="space-y-8">
      <section className="grid gap-8 md:grid-cols-2 bg-white p-6 rounded-md">
        <div>
          <img
            src="/images/livro.png"
            alt="Imagem do produto"
            className="w-full aspect-square object-cover rounded-md"
          />
          <div className="flex gap-2 mt-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <img
                key={i}
                src="/images/livro.png"
                alt="Imagem do produto"
                className="w-16 h-16 object-cover rounded-md"
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src="/images/user.jpg" alt="Avatar do vendedor" />
              <AvatarFallback>V</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Nome do vendedor</h2>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <div className="flex text-yellow-500">
                      {stars.map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < 4 ? "fill-current" : ""}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {avgRating.toFixed(1)} de 5
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {reviews.length} avaliações
                  </span>
                </div>
                <div className="flex items-center gap-1 text-red-500">
                  <ShoppingBag className="w-5 h-5" />
                  <span className="text-base font-medium">{type}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="h-px bg-black" />
          <div className="flex justify-between items-baseline">
            <h1 className="text-2xl font-bold">Livro X</h1>
            <div className="flex items-center gap-2">
              <p className="text-lg font-medium">{condition}</p>
              <button
                aria-label="Adicionar aos favoritos"
                className={`hover:text-red-500 ${favorited ? "text-red-500" : "text-gray-400"}`}
                onClick={() => setFavorited((prev) => !prev)}
              >
                <Heart
                  className="w-5 h-5"
                  fill={favorited ? "currentColor" : "none"}
                />
              </button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground -mt-3">{itemCount} itens</p>
          <p className="text-2xl font-bold mt-3">R$ 129,99</p>
          <div>
            <h3 className="text-xl font-semibold mb-1">Descrição</h3>
            <p className="text-base text-muted-foreground">
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              className="cursor-pointer flex-1 bg-[#1500FF] hover:bg-[#1200d6]"
              onClick={() => setInterested((prev) => !prev)}
            >
              {interested ? "Interesse demonstrado" : "Mostrar interesse"}
            </Button>
            <Button
              className="cursor-pointer flex-1 bg-blue-400 hover:bg-blue-500 text-white"
              disabled={inCart}
              onClick={() => setInCart(true)}
            >
              {inCart ? "Adicionado" : "Adicionar ao carrinho"}
            </Button>
          </div>
        </div>
      </section>

      <div className="h-px bg-black" />

      <section className="bg-white p-6 rounded-md space-y-12">
        <div>
          <h3 className="text-2xl font-semibold">Informações Adicionais</h3>
          <p className="text-base text-muted-foreground">
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
          </p>
        </div>
        <div>
          <h3 className="text-2xl font-semibold flex items-center gap-2">
            Opiniões do produto
            <span className="text-base text-muted-foreground">({reviews.length})</span>
          </h3>
          <div className="flex items-center gap-1 text-yellow-500 mt-1">
            {stars.map((_, i) => (
              <Star
                key={i}
                size={20}
                className={i < Math.round(avgRating) ? "fill-current" : ""}
              />
            ))}
            <span className="text-base text-muted-foreground">
              {avgRating.toFixed(1)} de 5
            </span>
          </div>
          <div className="mt-4 space-y-4">
            {reviews.map((r, i) => (
              <div key={i} className="p-4 border border-black rounded-md space-y-2">
                <div className="flex items-center gap-1 text-yellow-500">
                  {stars.map((_, j) => (
                    <Star
                      key={j}
                      size={14}
                      className={j < r.rating ? "fill-current" : ""}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground">{r.rating} de 5</span>
                </div>
                <h4 className="text-lg font-semibold">{r.title}</h4>
                <p className="text-base">{r.comment}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src="" alt={`Avatar de ${r.name}`} />
                    <AvatarFallback>{r.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col leading-none">
                    <span className="font-semibold">{r.name}</span>
                    <span className="text-sm text-muted-foreground">{r.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}