/*
  Warnings:

  - You are about to drop the column `preco` on the `Item` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Item" DROP COLUMN "preco",
ADD COLUMN     "preco_centavos" INTEGER,
ADD COLUMN     "preco_formatado" TEXT;
