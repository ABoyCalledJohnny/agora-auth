import { withApiHandler } from "@/src/lib/api-wrapper.ts";
import { notImplementedResponse } from "@/src/app/api/_utils/not-implemented.ts";

export const GET = withApiHandler({}, async () => notImplementedResponse("GET /api/auth/jwks"));
