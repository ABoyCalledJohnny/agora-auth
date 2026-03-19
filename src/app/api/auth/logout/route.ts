import { withApiHandler } from "@/src/lib/api-wrapper.ts";
import { notImplementedResponse } from "@/src/app/api/_utils/not-implemented.ts";

export const POST = withApiHandler({ auth: true }, async () => notImplementedResponse("POST /api/auth/logout"));
