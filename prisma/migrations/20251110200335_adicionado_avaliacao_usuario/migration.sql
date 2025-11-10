-- CreateTable
CREATE TABLE "AvaliacaoUsuario" (
    "id" UUID NOT NULL,
    "avaliador_id" UUID NOT NULL,
    "avaliado_id" UUID NOT NULL,
    "nota" DOUBLE PRECISION NOT NULL,
    "titulo" TEXT,
    "comentario" TEXT,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvaliacaoUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvaliacaoUsuario_avaliador_id_avaliado_id_key" ON "AvaliacaoUsuario"("avaliador_id", "avaliado_id");

-- AddForeignKey
ALTER TABLE "AvaliacaoUsuario" ADD CONSTRAINT "AvaliacaoUsuario_avaliador_id_fkey" FOREIGN KEY ("avaliador_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoUsuario" ADD CONSTRAINT "AvaliacaoUsuario_avaliado_id_fkey" FOREIGN KEY ("avaliado_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
