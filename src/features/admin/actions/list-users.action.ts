"use server";

import { withActionHandler } from "@/src/lib/action-wrapper.ts";

import { adminListUsersSchema } from "../contracts.ts";
import { AdminService } from "../services/admin.service.ts";

export const listUsersAction = withActionHandler(
  {
    bodySchema: adminListUsersSchema,
    auth: true,
    roles: ["admin"],
  },
  async ({ data }) => {
    return await AdminService.listUsers(data);
  },
);
