-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('VALID', 'REVOKED');

-- AlterTable
ALTER TABLE "GeneratedDocument" ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "revokedById" TEXT,
ADD COLUMN     "status" "DocumentStatus" NOT NULL DEFAULT 'VALID';

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
