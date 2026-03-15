import { withApiHandler } from "@/src/lib/api-wrapper";
import { notImplementedResponse } from "@/src/app/api/_utils/not-implemented";

export const DELETE = withApiHandler({ auth: true, roles: ["admin"] }, async () =>
  notImplementedResponse("DELETE /api/admin/users/:id"),
);
