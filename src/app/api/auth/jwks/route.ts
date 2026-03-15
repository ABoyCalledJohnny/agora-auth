import { withApiHandler } from "@/src/lib/api-wrapper";
import { notImplementedResponse } from "@/src/app/api/_utils/not-implemented";

export const GET = withApiHandler({}, async () => notImplementedResponse("GET /api/auth/jwks"));
