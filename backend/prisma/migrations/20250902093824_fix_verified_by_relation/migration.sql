-- DropForeignKey
ALTER TABLE "providers" DROP CONSTRAINT "providers_verifiedBy_fkey";

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
