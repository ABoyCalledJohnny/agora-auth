import { withApiHandler } from "@/src/lib/api-wrapper";
import { notImplementedResponse } from "@/src/app/api/_utils/not-implemented";

export const POST = withApiHandler({}, async () => notImplementedResponse("POST /api/auth/reset-password/request"));
