-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('ENVIO', 'RECOGER');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deliveryMethod" "DeliveryMethod" NOT NULL DEFAULT 'ENVIO';
