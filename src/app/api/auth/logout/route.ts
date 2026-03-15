import { withApiHandler } from "@/src/lib/api-wrapper";
import { notImplementedResponse } from "@/src/app/api/_utils/not-implemented";

export const POST = withApiHandler({ auth: true }, async () => notImplementedResponse("POST /api/auth/logout"));
