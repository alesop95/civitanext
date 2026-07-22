-- AlterTable
ALTER TABLE "User" ADD COLUMN     "digestOptIn" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Webinar" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Webinar_pkey" PRIMARY KEY ("id")
);

