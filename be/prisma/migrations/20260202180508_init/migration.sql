-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'TRADER');

-- CreateEnum
CREATE TYPE "OrderDirection" AS ENUM ('UP', 'DOWN');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'LOCKED', 'SETTLED');

-- CreateEnum
CREATE TYPE "TradeResult" AS ENUM ('WIN', 'LOSE');

-- CreateEnum
CREATE TYPE "CopyType" AS ENUM ('FIXED', 'PERCENT');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAW', 'LOCK', 'UNLOCK', 'SETTLE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "nickname" TEXT,
    "avatar_url" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_trades" INTEGER NOT NULL DEFAULT 0,
    "win_trades" INTEGER NOT NULL DEFAULT 0,
    "lose_trades" INTEGER NOT NULL DEFAULT 0,
    "total_pnl" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "win_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,

    CONSTRAINT "user_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "balance" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "locked_balance" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "tx_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trading_pairs" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "payout_rate" DECIMAL(5,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "trading_pairs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "pair_id" TEXT NOT NULL,
    "direction" "OrderDirection" NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "payout_rate" DECIMAL(5,2) NOT NULL,
    "entry_price" DECIMAL(20,8),
    "open_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expire_time" TIMESTAMP(3) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "trade_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_order_results" (
    "id" TEXT NOT NULL,
    "trade_id" TEXT NOT NULL,
    "settle_price" DECIMAL(20,8) NOT NULL,
    "result" "TradeResult" NOT NULL,
    "profit" DECIMAL(20,2) NOT NULL,
    "settled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_order_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "copy_traders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "risk_score" INTEGER NOT NULL DEFAULT 50,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "copy_traders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "copy_followers" (
    "id" TEXT NOT NULL,
    "trader_id" TEXT NOT NULL,
    "follower_id" TEXT NOT NULL,
    "copy_type" "CopyType" NOT NULL,
    "copy_value" DECIMAL(20,2) NOT NULL,
    "max_amount" DECIMAL(20,2) NOT NULL,
    "stop_loss" DECIMAL(20,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "copy_followers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "copy_trade_orders" (
    "id" TEXT NOT NULL,
    "source_trade_id" TEXT NOT NULL,
    "follower_trade_id" TEXT NOT NULL,

    CONSTRAINT "copy_trade_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_feed_logs" (
    "id" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "source" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_feed_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_logs" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_wallet_address_key" ON "users"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "user_stats_user_id_key" ON "user_stats"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "trading_pairs_symbol_key" ON "trading_pairs"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "trade_order_results_trade_id_key" ON "trade_order_results"("trade_id");

-- CreateIndex
CREATE UNIQUE INDEX "copy_traders_user_id_key" ON "copy_traders"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "copy_followers_follower_id_trader_id_key" ON "copy_followers"("follower_id", "trader_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- AddForeignKey
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_orders" ADD CONSTRAINT "trade_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_orders" ADD CONSTRAINT "trade_orders_pair_id_fkey" FOREIGN KEY ("pair_id") REFERENCES "trading_pairs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_order_results" ADD CONSTRAINT "trade_order_results_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trade_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copy_traders" ADD CONSTRAINT "copy_traders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copy_followers" ADD CONSTRAINT "copy_followers_trader_id_fkey" FOREIGN KEY ("trader_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copy_followers" ADD CONSTRAINT "copy_followers_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copy_trade_orders" ADD CONSTRAINT "copy_trade_orders_source_trade_id_fkey" FOREIGN KEY ("source_trade_id") REFERENCES "trade_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copy_trade_orders" ADD CONSTRAINT "copy_trade_orders_follower_trade_id_fkey" FOREIGN KEY ("follower_trade_id") REFERENCES "trade_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
