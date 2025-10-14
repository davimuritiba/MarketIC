-- CreateEnum
CREATE TYPE "TipoTransacao" AS ENUM ('VENDA', 'TROCA', 'DOACAO', 'EMPRESTIMO');

-- CreateEnum
CREATE TYPE "EstadoConservacao" AS ENUM ('NOVO', 'SEMINOVO', 'USADO');

-- CreateEnum
CREATE TYPE "StatusInteresse" AS ENUM ('PENDENTE', 'ACEITO', 'RECUSADO');

-- CreateTable
CREATE TABLE "Categoria" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" UUID NOT NULL,
    "CPF" TEXT NOT NULL,
    "RG" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email_institucional" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "data_nascimento" TIMESTAMP(3) NOT NULL,
    "reputacao_media" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reputacao_count" INTEGER,
    "curso" TEXT NOT NULL,
    "foto_documento_url" TEXT NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "categoria_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo_transacao" "TipoTransacao" NOT NULL,
    "estado_conservacao" "EstadoConservacao" NOT NULL,
    "preco" DOUBLE PRECISION,
    "prazo_dias" INTEGER,
    "quantidade_disponivel" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImagemAnuncio" (
    "id" UUID NOT NULL,
    "anuncio_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "ImagemAnuncio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvaliacaoItem" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "anuncio_id" UUID NOT NULL,
    "nota" DOUBLE PRECISION NOT NULL,
    "titulo" TEXT,
    "comentario" TEXT,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resposta_vendedor" TEXT,
    "respondido_em" TIMESTAMP(3),
    "criado_por" UUID,

    CONSTRAINT "AvaliacaoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interesse" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "anuncio_id" UUID NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "status" "StatusInteresse" NOT NULL DEFAULT 'PENDENTE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interesse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarrinhoItem" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "anuncio_id" UUID NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "interested_flag" BOOLEAN NOT NULL DEFAULT false,
    "prazo_snapshot" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarrinhoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorito" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "anuncio_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "usuario_id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nome_key" ON "Categoria"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_slug_key" ON "Categoria"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_CPF_key" ON "Usuario"("CPF");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_RG_key" ON "Usuario"("RG");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_institucional_key" ON "Usuario"("email_institucional");

-- CreateIndex
CREATE UNIQUE INDEX "CarrinhoItem_usuario_id_anuncio_id_key" ON "CarrinhoItem"("usuario_id", "anuncio_id");

-- CreateIndex
CREATE UNIQUE INDEX "Favorito_usuario_id_anuncio_id_key" ON "Favorito"("usuario_id", "anuncio_id");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagemAnuncio" ADD CONSTRAINT "ImagemAnuncio_anuncio_id_fkey" FOREIGN KEY ("anuncio_id") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoItem" ADD CONSTRAINT "AvaliacaoItem_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoItem" ADD CONSTRAINT "AvaliacaoItem_anuncio_id_fkey" FOREIGN KEY ("anuncio_id") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoItem" ADD CONSTRAINT "AvaliacaoItem_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interesse" ADD CONSTRAINT "Interesse_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interesse" ADD CONSTRAINT "Interesse_anuncio_id_fkey" FOREIGN KEY ("anuncio_id") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarrinhoItem" ADD CONSTRAINT "CarrinhoItem_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarrinhoItem" ADD CONSTRAINT "CarrinhoItem_anuncio_id_fkey" FOREIGN KEY ("anuncio_id") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_anuncio_id_fkey" FOREIGN KEY ("anuncio_id") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
