import { withApiHandler } from "@/src/lib/api-wrapper.ts";
import { notImplementedResponse } from "@/src/app/api/_utils/not-implemented.ts";

export const DELETE = withApiHandler({ auth: true, roles: ["admin"] }, async () =>
  notImplementedResponse("DELETE /api/admin/users/:id"),
);
