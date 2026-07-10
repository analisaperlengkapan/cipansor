-- E-Simaan: recorded recitation audio for async muhafidz review
ALTER TABLE "tahfidz_records" ADD COLUMN "audio_url" TEXT;

-- Maktabah digital: e-book/kitab collections on the existing Book model
ALTER TABLE "books" ADD COLUMN "is_digital" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "books" ADD COLUMN "file_url" TEXT;
ALTER TABLE "books" ADD COLUMN "file_type" TEXT;

-- Si-Peka: precise facility location (building/room/asset) on complaints
ALTER TABLE "complaints" ADD COLUMN "building_id" TEXT;
ALTER TABLE "complaints" ADD COLUMN "room_id" TEXT;
ALTER TABLE "complaints" ADD COLUMN "asset_id" TEXT;

ALTER TABLE "complaints" ADD CONSTRAINT "complaints_building_id_fkey"
  FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_room_id_fkey"
  FOREIGN KEY ("room_id") REFERENCES "facility_rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_asset_id_fkey"
  FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Si-Taka: university placement tracking on alumni education history
ALTER TABLE "alumni_educations" ADD COLUMN "admission_path" TEXT;
ALTER TABLE "alumni_educations" ADD COLUMN "scholarship_name" TEXT;
ALTER TABLE "alumni_educations" ADD COLUMN "is_international" BOOLEAN NOT NULL DEFAULT false;
