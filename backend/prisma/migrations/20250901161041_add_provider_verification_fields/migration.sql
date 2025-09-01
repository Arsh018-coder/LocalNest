-- AlterTable
ALTER TABLE "providers" ADD COLUMN     "verificationRequested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationRequestedAt" TIMESTAMP(3);
