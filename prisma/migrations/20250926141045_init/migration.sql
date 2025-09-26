-- AlterTable
ALTER TABLE "public"."Utilisateur" ADD COLUMN     "resetPasswordExpires" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT;
