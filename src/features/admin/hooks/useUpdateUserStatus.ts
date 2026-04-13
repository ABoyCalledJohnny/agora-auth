import type { UserStatus } from "@/src/config/constants.ts";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { updateUserStatusAction } from "../actions/update-user-status.action.ts";

export function useUpdateUserStatus() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function updateStatus(userId: string, status: UserStatus) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("status", status);

      const result = await updateUserStatusAction(formData);

      if (result.success) {
        router.refresh();
      }
    });
  }

  return { updateStatus, isPending };
}
