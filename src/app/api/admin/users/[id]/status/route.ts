import { NextResponse } from "next/server";

import enTranslations from "@/messages/en.json";
import { adminUpdateUserStatusSchema } from "@/src/features/admin/contracts.ts";
import { AdminService } from "@/src/features/admin/services/admin.service.ts";
import { withApiHandler } from "@/src/lib/api-wrapper.ts";
import { AgoraError } from "@/src/lib/errors.ts";

export const PATCH = withApiHandler(
  { auth: true, roles: ["admin"], bodySchema: adminUpdateUserStatusSchema },
  async ({ data, session, params }) => {
    const { id } = await params;
    if (!id) throw new AgoraError("VALIDATION_ERROR", "Missing user ID.");
    const result = await AdminService.updateUserStatus(id, session!.user.id, data);

    return NextResponse.json({ success: true, data: result, message: enTranslations.Admin.Users.statusUpdateSuccess });
  },
);
