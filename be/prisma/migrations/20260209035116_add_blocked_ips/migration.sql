/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WithdrawStatus" AS ENUM ('PENDING', 'APPROVED', 'COMPLETED', 'REJECTED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "password_hash" TEXT,
ALTER COLUMN "wallet_address" DROP NOT NULL;

-- CreateTable
CREATE TABLE "price_candles" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "open" DECIMAL(20,8) NOT NULL,
    "high" DECIMAL(20,8) NOT NULL,
    "low" DECIMAL(20,8) NOT NULL,
    "close" DECIMAL(20,8) NOT NULL,
    "volume" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_candles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_ticks" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_ticks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "bank_code" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bank_account_id" TEXT NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "code_pay" TEXT NOT NULL,
    "status" "DepositStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expired_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposit_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdraw_orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "bank_name" TEXT NOT NULL,
    "bank_code" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "status" "WithdrawStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "admin_note" TEXT,
    "processed_by" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdraw_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocked_ips" (
    "id" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "reason" TEXT,
    "blocked_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_ips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_candles_symbol_time_idx" ON "price_candles"("symbol", "time");

-- CreateIndex
CREATE UNIQUE INDEX "price_candles_symbol_time_key" ON "price_candles"("symbol", "time");

-- CreateIndex
CREATE INDEX "price_ticks_symbol_timestamp_idx" ON "price_ticks"("symbol", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "deposit_orders_code_pay_key" ON "deposit_orders"("code_pay");

-- CreateIndex
CREATE INDEX "deposit_orders_user_id_status_idx" ON "deposit_orders"("user_id", "status");

-- CreateIndex
CREATE INDEX "deposit_orders_code_pay_idx" ON "deposit_orders"("code_pay");

-- CreateIndex
CREATE INDEX "withdraw_orders_user_id_status_idx" ON "withdraw_orders"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "blocked_ips_ip_address_key" ON "blocked_ips"("ip_address");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "deposit_orders" ADD CONSTRAINT "deposit_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_orders" ADD CONSTRAINT "deposit_orders_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdraw_orders" ADD CONSTRAINT "withdraw_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
