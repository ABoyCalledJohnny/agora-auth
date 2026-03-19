import { withApiHandler } from "@/src/lib/api-wrapper.ts";
import { notImplementedResponse } from "@/src/app/api/_utils/not-implemented.ts";

export const POST = withApiHandler({}, async () => notImplementedResponse("POST /api/auth/register"));
