-- CreateEnum
CREATE TYPE "StatusAnuncio" AS ENUM ('PUBLICADO', 'INATIVO', 'FINALIZADO', 'EXPIRADO');

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "expira_em" TIMESTAMP(3),
ADD COLUMN     "finalizado_em" TIMESTAMP(3),
ADD COLUMN     "inativado_em" TIMESTAMP(3),
ADD COLUMN     "publicado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "StatusAnuncio" NOT NULL DEFAULT 'PUBLICADO';
