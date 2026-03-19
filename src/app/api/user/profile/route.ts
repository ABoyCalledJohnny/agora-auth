import { notImplementedResponse } from "@/src/app/api/_utils/not-implemented.ts";
import { withApiHandler } from "@/src/lib/api-wrapper.ts";

export const GET = withApiHandler({ auth: true }, async () => notImplementedResponse("GET /api/user/profile"));

export const PATCH = withApiHandler({ auth: true }, async () => notImplementedResponse("PATCH /api/user/profile"));
