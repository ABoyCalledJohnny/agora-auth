import { withApiHandler } from "@/src/lib/api-wrapper.ts";
import { AgoraError } from "@/src/lib/errors.ts";

export const POST = withApiHandler({}, async () => {
  throw new AgoraError("NOT_IMPLEMENTED");
});
