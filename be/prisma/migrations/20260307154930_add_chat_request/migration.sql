-- CreateEnum
CREATE TYPE "ChatRequestStatus" AS ENUM ('WAITING', 'ACTIVE', 'CLOSED');

-- CreateTable
CREATE TABLE "chat_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "ChatRequestStatus" NOT NULL DEFAULT 'WAITING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "chat_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_requests_user_id_status_idx" ON "chat_requests"("user_id", "status");

-- AddForeignKey
ALTER TABLE "chat_requests" ADD CONSTRAINT "chat_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
