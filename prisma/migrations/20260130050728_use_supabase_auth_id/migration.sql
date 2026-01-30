-- AlterTable
ALTER TABLE "qr_codes" ALTER COLUMN "code" SET DEFAULT encode(gen_random_bytes(8), 'hex');

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;
