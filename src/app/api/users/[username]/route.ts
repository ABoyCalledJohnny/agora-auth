import { withApiHandler } from "@/src/lib/api-wrapper.ts";
import { notImplementedResponse } from "@/src/app/api/_utils/not-implemented.ts";

export const GET = withApiHandler({ auth: true }, async () => notImplementedResponse("GET /api/users/:username"));
