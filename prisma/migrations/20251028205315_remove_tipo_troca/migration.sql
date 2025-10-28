/*
  Warnings:

  - The values [TROCA] on the enum `TipoTransacao` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TipoTransacao_new" AS ENUM ('VENDA', 'DOACAO', 'EMPRESTIMO');
ALTER TABLE "Item" ALTER COLUMN "tipo_transacao" TYPE "TipoTransacao_new" USING ("tipo_transacao"::text::"TipoTransacao_new");
ALTER TYPE "TipoTransacao" RENAME TO "TipoTransacao_old";
ALTER TYPE "TipoTransacao_new" RENAME TO "TipoTransacao";
DROP TYPE "public"."TipoTransacao_old";
COMMIT;
