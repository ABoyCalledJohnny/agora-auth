import { withApiHandler } from "@/src/lib/api-wrapper";
import { notImplementedResponse } from "@/src/app/api/_utils/not-implemented";

export const DELETE = withApiHandler({ auth: true }, async () => notImplementedResponse("DELETE /api/user"));
