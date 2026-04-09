CREATE TYPE "public"."role_name" AS ENUM('admin', 'user');--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "name" SET DATA TYPE "public"."role_name" USING "name"::"public"."role_name";