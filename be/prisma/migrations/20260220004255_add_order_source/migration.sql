-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('MANUAL', 'BOT', 'COPY_TRADE');

-- AlterTable
ALTER TABLE "trade_orders" ADD COLUMN     "order_source" "OrderSource" NOT NULL DEFAULT 'MANUAL';
