import { withApiHandler } from "@/src/lib/api-wrapper";
import { notImplementedResponse } from "@/src/app/api/_utils/not-implemented";

export const GET = withApiHandler({ auth: true, roles: ["admin"] }, async () =>
  notImplementedResponse("GET /api/admin/users"),
);
