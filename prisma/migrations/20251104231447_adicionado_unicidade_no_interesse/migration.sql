/*
  Warnings:

  - A unique constraint covering the columns `[usuario_id,anuncio_id]` on the table `Interesse` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Interesse_usuario_id_anuncio_id_key" ON "Interesse"("usuario_id", "anuncio_id");
