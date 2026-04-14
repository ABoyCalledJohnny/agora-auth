import { NextResponse } from "next/server";

import enTranslations from "@/messages/en.json";
import { NO_STORE_HEADERS } from "@/src/config/constants.ts";
import { adminListUsersSchema } from "@/src/features/admin/contracts.ts";
import { AdminService } from "@/src/features/admin/services/admin.service.ts";
import { withApiHandler } from "@/src/lib/api-wrapper.ts";

export const GET = withApiHandler({ auth: true, roles: ["admin"] }, async ({ request }) => {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const query = adminListUsersSchema.parse(searchParams);
  const result = await AdminService.listUsers(query);

  return NextResponse.json(
    { success: true, data: result, message: enTranslations.Common.success },
    { headers: NO_STORE_HEADERS },
  );
});
