-- CreateEnum
CREATE TYPE "TimeSlotStatus" AS ENUM ('AVAILABLE', 'BOOKED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Subject" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "gradeLevel" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorSubject" (
    "tutorId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "customRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TutorSubject_pkey" PRIMARY KEY ("tutorId","subjectId")
);

-- CreateTable
CREATE TABLE "TimeSlot" (
    "id" UUID NOT NULL,
    "tutorId" UUID NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "TimeSlotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");

-- AddForeignKey
ALTER TABLE "TutorSubject" ADD CONSTRAINT "TutorSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
