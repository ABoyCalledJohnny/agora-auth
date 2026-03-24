import { withApiHandler } from "@/src/lib/api-wrapper.ts";
import { AgoraError } from "@/src/lib/errors.ts";

export const GET = withApiHandler({ auth: true }, async () => {
  throw new AgoraError("NOT_IMPLEMENTED");
});
