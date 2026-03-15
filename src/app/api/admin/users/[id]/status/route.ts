import { withApiHandler } from "@/src/lib/api-wrapper";
import { notImplementedResponse } from "@/src/app/api/_utils/not-implemented";

export const PATCH = withApiHandler({ auth: true, roles: ["admin"] }, async () =>
  notImplementedResponse("PATCH /api/admin/users/:id/status"),
);
