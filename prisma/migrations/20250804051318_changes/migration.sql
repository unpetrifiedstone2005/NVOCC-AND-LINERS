/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `SurchargeDef` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SurchargeDef_name_key" ON "SurchargeDef"("name");
