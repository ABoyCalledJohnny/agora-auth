"use server";

import { z } from "zod";

import { withActionHandler } from "@/src/lib/action-wrapper.ts";

import { AdminService } from "../services/admin.service.ts";

const deleteUserActionSchema = z.object({
  userId: z.uuid(),
});

export const deleteUserAction = withActionHandler(
  {
    bodySchema: deleteUserActionSchema,
    auth: true,
    roles: ["admin"],
  },
  async ({ data: { userId }, session }) => {
    return await AdminService.deleteUser(userId, session!.user.id);
  },
);
