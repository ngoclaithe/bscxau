-- CreateEnum
CREATE TYPE "BotStrategyType" AS ENUM ('ALWAYS_UP', 'ALWAYS_DOWN', 'ALTERNATE', 'RANDOM');

-- CreateTable
CREATE TABLE "bot_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "pair_id" TEXT,
    "timeframe_sec" INTEGER NOT NULL DEFAULT 30,
    "base_amount" DECIMAL(20,2) NOT NULL DEFAULT 1,
    "current_amount" DECIMAL(20,2) NOT NULL DEFAULT 1,
    "strategy_type" "BotStrategyType" NOT NULL DEFAULT 'RANDOM',
    "last_direction" TEXT,
    "use_martingale" BOOLEAN NOT NULL DEFAULT false,
    "martingale_factor" DECIMAL(5,2) NOT NULL DEFAULT 2,
    "take_profit" DECIMAL(20,2),
    "stop_loss" DECIMAL(20,2),
    "session_profit" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "session_trades" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bot_settings_user_id_key" ON "bot_settings"("user_id");

-- AddForeignKey
ALTER TABLE "bot_settings" ADD CONSTRAINT "bot_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
