import { withApiHandler } from "@/src/lib/api-wrapper";
import { notImplementedResponse } from "@/src/app/api/_utils/not-implemented";

export const PATCH = withApiHandler({ auth: true }, async () => notImplementedResponse("PATCH /api/user/password"));
