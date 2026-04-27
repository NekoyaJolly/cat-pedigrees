-- CreateTable
CREATE TABLE "breeds" (
    "id" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "breeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coat_colors" (
    "id" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coat_colors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genders" (
    "id" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "genders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedigrees" (
    "id" TEXT NOT NULL,
    "pedigree_id" TEXT NOT NULL,
    "title" TEXT,
    "cat_name" TEXT,
    "cat_name2" TEXT,
    "breed_code" INTEGER,
    "gender_code" INTEGER,
    "eye_color" TEXT,
    "coat_color_code" INTEGER,
    "birth_date" TEXT,
    "breeder_name" TEXT,
    "owner_name" TEXT,
    "registration_date" TEXT,
    "brother_count" INTEGER,
    "sister_count" INTEGER,
    "notes" TEXT,
    "notes2" TEXT,
    "other_no" TEXT,
    "father_title" TEXT,
    "father_cat_name" TEXT,
    "father_cat_name2" TEXT,
    "father_coat_color" TEXT,
    "father_eye_color" TEXT,
    "father_jcu" TEXT,
    "father_other_code" TEXT,
    "mother_title" TEXT,
    "mother_cat_name" TEXT,
    "mother_cat_name2" TEXT,
    "mother_coat_color" TEXT,
    "mother_eye_color" TEXT,
    "mother_jcu" TEXT,
    "mother_other_code" TEXT,
    "ff_title" TEXT,
    "ff_cat_name" TEXT,
    "ff_cat_color" TEXT,
    "fm_title" TEXT,
    "fm_cat_name" TEXT,
    "fm_cat_color" TEXT,
    "mf_title" TEXT,
    "mf_cat_name" TEXT,
    "mf_cat_color" TEXT,
    "mm_title" TEXT,
    "mm_cat_name" TEXT,
    "mm_cat_color" TEXT,
    "fff_title" TEXT,
    "fff_cat_name" TEXT,
    "fff_cat_color" TEXT,
    "ffm_title" TEXT,
    "ffm_cat_name" TEXT,
    "ffm_cat_color" TEXT,
    "fmf_title" TEXT,
    "fmf_cat_name" TEXT,
    "fmf_cat_color" TEXT,
    "fmm_title" TEXT,
    "fmm_cat_name" TEXT,
    "fmm_cat_color" TEXT,
    "mff_title" TEXT,
    "mff_cat_name" TEXT,
    "mff_cat_color" TEXT,
    "mfm_title" TEXT,
    "mfm_cat_name" TEXT,
    "mfm_cat_color" TEXT,
    "mmf_title" TEXT,
    "mmf_cat_name" TEXT,
    "mmf_cat_color" TEXT,
    "mmm_title" TEXT,
    "mmm_cat_name" TEXT,
    "mmm_cat_color" TEXT,
    "old_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "fffjcu" TEXT,
    "ffjcu" TEXT,
    "ffmjcu" TEXT,
    "fmfjcu" TEXT,
    "fmjcu" TEXT,
    "fmmjcu" TEXT,
    "mffjcu" TEXT,
    "mfjcu" TEXT,
    "mfmjcu" TEXT,
    "mmfjcu" TEXT,
    "mmjcu" TEXT,
    "mmmjcu" TEXT,

    CONSTRAINT "pedigrees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "breeds_code_key" ON "breeds"("code");

-- CreateIndex
CREATE UNIQUE INDEX "breeds_name_key" ON "breeds"("name");

-- CreateIndex
CREATE INDEX "breeds_code_idx" ON "breeds"("code");

-- CreateIndex
CREATE INDEX "breeds_name_idx" ON "breeds"("name");

-- CreateIndex
CREATE INDEX "breeds_is_active_idx" ON "breeds"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "coat_colors_code_key" ON "coat_colors"("code");

-- CreateIndex
CREATE INDEX "coat_colors_code_idx" ON "coat_colors"("code");

-- CreateIndex
CREATE INDEX "coat_colors_name_idx" ON "coat_colors"("name");

-- CreateIndex
CREATE INDEX "coat_colors_is_active_idx" ON "coat_colors"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "genders_code_key" ON "genders"("code");

-- CreateIndex
CREATE UNIQUE INDEX "genders_name_key" ON "genders"("name");

-- CreateIndex
CREATE INDEX "genders_code_idx" ON "genders"("code");

-- CreateIndex
CREATE INDEX "genders_name_idx" ON "genders"("name");

-- CreateIndex
CREATE UNIQUE INDEX "pedigrees_pedigree_id_key" ON "pedigrees"("pedigree_id");

-- CreateIndex
CREATE INDEX "pedigrees_breed_code_idx" ON "pedigrees"("breed_code");

-- CreateIndex
CREATE INDEX "pedigrees_gender_code_idx" ON "pedigrees"("gender_code");

-- CreateIndex
CREATE INDEX "pedigrees_coat_color_code_idx" ON "pedigrees"("coat_color_code");

-- CreateIndex
CREATE INDEX "pedigrees_cat_name_idx" ON "pedigrees"("cat_name");

-- CreateIndex
CREATE INDEX "pedigrees_pedigree_id_idx" ON "pedigrees"("pedigree_id");

-- CreateIndex
CREATE INDEX "pedigrees_cat_name2_idx" ON "pedigrees"("cat_name2");

-- CreateIndex
CREATE INDEX "pedigrees_eye_color_idx" ON "pedigrees"("eye_color");

-- CreateIndex
CREATE INDEX "pedigrees_breeder_name_idx" ON "pedigrees"("breeder_name");

-- CreateIndex
CREATE INDEX "pedigrees_owner_name_idx" ON "pedigrees"("owner_name");

-- CreateIndex
CREATE INDEX "pedigrees_birth_date_idx" ON "pedigrees"("birth_date");

-- CreateIndex
CREATE INDEX "pedigrees_registration_date_idx" ON "pedigrees"("registration_date");

-- CreateIndex
CREATE INDEX "pedigrees_created_at_idx" ON "pedigrees"("created_at");

-- CreateIndex
CREATE INDEX "pedigrees_updated_at_idx" ON "pedigrees"("updated_at");

-- CreateIndex
CREATE INDEX "pedigrees_breed_code_cat_name_idx" ON "pedigrees"("breed_code", "cat_name");

-- AddForeignKey
ALTER TABLE "pedigrees" ADD CONSTRAINT "pedigrees_gender_code_fkey" FOREIGN KEY ("gender_code") REFERENCES "genders"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedigrees" ADD CONSTRAINT "pedigrees_coat_color_code_fkey" FOREIGN KEY ("coat_color_code") REFERENCES "coat_colors"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedigrees" ADD CONSTRAINT "pedigrees_breed_code_fkey" FOREIGN KEY ("breed_code") REFERENCES "breeds"("code") ON DELETE SET NULL ON UPDATE CASCADE;
