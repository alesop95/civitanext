-- AlterTable
ALTER TABLE "Proposal" ADD COLUMN "implementationNote" TEXT;

-- CreateTable
CREATE TABLE "ProposalStep" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "done" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProposalStep_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProposalStep" ADD CONSTRAINT "ProposalStep_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
