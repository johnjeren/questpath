-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED');

-- CreateEnum
CREATE TYPE "StopType" AS ENUM ('PHYSICAL', 'DIGITAL', 'TIMED', 'CONDITIONAL');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,
    "bio" TEXT,
    "website" TEXT,
    "social_links" JSONB,
    "is_creator" BOOLEAN NOT NULL DEFAULT false,
    "stripe_account_id" TEXT,
    "default_visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journeys" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cover_image" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMPTZ,
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "parent_journey_id" UUID,
    "price" DECIMAL(10,2),
    "total_sales" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "total_plays" INTEGER NOT NULL DEFAULT 0,
    "total_completions" INTEGER NOT NULL DEFAULT 0,
    "avg_rating" DECIMAL(3,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "journeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stops" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "journey_id" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "StopType" NOT NULL DEFAULT 'PHYSICAL',
    "title" TEXT NOT NULL,
    "message" TEXT,
    "image_url" TEXT,
    "video_url" TEXT,
    "audio_url" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "radius" INTEGER DEFAULT 50,
    "unlock_at" TIMESTAMPTZ,
    "requires_stop_ids" UUID[] DEFAULT ARRAY[]::UUID[],
    "require_photo" BOOLEAN NOT NULL DEFAULT false,
    "quiz_data" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
    "journey_id" UUID NOT NULL,
    "stop_id" UUID NOT NULL,
    "scan_count" INTEGER NOT NULL DEFAULT 0,
    "last_scanned_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qr_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_progress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "journey_id" UUID NOT NULL,
    "stop_id" UUID NOT NULL,
    "completed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scan_latitude" DECIMAL(10,8),
    "scan_longitude" DECIMAL(11,8),
    "distance_meters" INTEGER,
    "photo_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "scan_device" TEXT,
    "time_taken" INTEGER,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "journey_id" UUID NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "platform_fee_cents" INTEGER NOT NULL,
    "creator_payout_cents" INTEGER NOT NULL,
    "stripe_payment_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_is_creator_idx" ON "users"("is_creator");

-- CreateIndex
CREATE INDEX "journeys_user_id_idx" ON "journeys"("user_id");

-- CreateIndex
CREATE INDEX "journeys_visibility_is_published_idx" ON "journeys"("visibility", "is_published");

-- CreateIndex
CREATE INDEX "journeys_is_template_idx" ON "journeys"("is_template");

-- CreateIndex
CREATE INDEX "journeys_parent_journey_id_idx" ON "journeys"("parent_journey_id");

-- CreateIndex
CREATE INDEX "journeys_category_idx" ON "journeys"("category");

-- CreateIndex
CREATE INDEX "journeys_featured_is_published_idx" ON "journeys"("featured", "is_published");

-- CreateIndex
CREATE INDEX "journeys_tags_idx" ON "journeys" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "stops_journey_id_idx" ON "stops"("journey_id");

-- CreateIndex
CREATE INDEX "stops_type_idx" ON "stops"("type");

-- CreateIndex
CREATE UNIQUE INDEX "stops_journey_id_order_key" ON "stops"("journey_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "qr_codes_code_key" ON "qr_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "qr_codes_stop_id_key" ON "qr_codes"("stop_id");

-- CreateIndex
CREATE INDEX "qr_codes_code_idx" ON "qr_codes"("code");

-- CreateIndex
CREATE INDEX "qr_codes_journey_id_idx" ON "qr_codes"("journey_id");

-- CreateIndex
CREATE INDEX "user_progress_user_id_idx" ON "user_progress"("user_id");

-- CreateIndex
CREATE INDEX "user_progress_journey_id_idx" ON "user_progress"("journey_id");

-- CreateIndex
CREATE INDEX "user_progress_user_id_journey_id_idx" ON "user_progress"("user_id", "journey_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_progress_user_id_journey_id_stop_id_key" ON "user_progress"("user_id", "journey_id", "stop_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_stripe_payment_id_key" ON "purchases"("stripe_payment_id");

-- CreateIndex
CREATE INDEX "purchases_user_id_idx" ON "purchases"("user_id");

-- CreateIndex
CREATE INDEX "purchases_journey_id_idx" ON "purchases"("journey_id");

-- CreateIndex
CREATE INDEX "purchases_stripe_payment_id_idx" ON "purchases"("stripe_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_user_id_journey_id_key" ON "purchases"("user_id", "journey_id");

-- AddForeignKey
ALTER TABLE "journeys" ADD CONSTRAINT "journeys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journeys" ADD CONSTRAINT "journeys_parent_journey_id_fkey" FOREIGN KEY ("parent_journey_id") REFERENCES "journeys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stops" ADD CONSTRAINT "stops_journey_id_fkey" FOREIGN KEY ("journey_id") REFERENCES "journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_journey_id_fkey" FOREIGN KEY ("journey_id") REFERENCES "journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_stop_id_fkey" FOREIGN KEY ("stop_id") REFERENCES "stops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_journey_id_fkey" FOREIGN KEY ("journey_id") REFERENCES "journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_stop_id_fkey" FOREIGN KEY ("stop_id") REFERENCES "stops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_journey_id_fkey" FOREIGN KEY ("journey_id") REFERENCES "journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
