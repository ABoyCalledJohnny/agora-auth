import { NextResponse } from "next/server";

import enTranslations from "@/messages/en.json";
import { AdminService } from "@/src/features/admin/services/admin.service.ts";
import { withApiHandler } from "@/src/lib/api-wrapper.ts";
import { AgoraError } from "@/src/lib/errors.ts";

export const DELETE = withApiHandler({ auth: true, roles: ["admin"] }, async ({ session, params }) => {
  const { id } = await params;
  if (!id) throw new AgoraError("VALIDATION_ERROR", "Missing user ID.");
  const result = await AdminService.deleteUser(id, session!.user.id);

  return NextResponse.json({ success: true, data: result, message: enTranslations.Admin.Users.deleteSuccess });
});
