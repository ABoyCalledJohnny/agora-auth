"use server";

import { z } from "zod";

import { withActionHandler } from "@/src/lib/action-wrapper.ts";

import { adminUpdateUserStatusSchema } from "../contracts.ts";
import { AdminService } from "../services/admin.service.ts";

const updateUserStatusActionSchema = adminUpdateUserStatusSchema.extend({
  userId: z.uuid(),
});

export const updateUserStatusAction = withActionHandler(
  {
    bodySchema: updateUserStatusActionSchema,
    auth: true,
    roles: ["admin"],
  },
  async ({ data: { userId, status }, session }) => {
    return await AdminService.updateUserStatus(userId, session!.user.id, { status });
  },
);
