import type { UserStatus } from "@/src/config/constants.ts";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { updateUserStatusAction } from "../actions/update-user-status.action.ts";

type UpdateStatusCallbacks = {
  onSuccess?: () => void;
  onError?: () => void;
};

export function useUpdateUserStatus() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function updateStatus(userId: string, status: UserStatus, { onSuccess, onError }: UpdateStatusCallbacks = {}) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("status", status);

      const result = await updateUserStatusAction(formData);

      if (result.success) {
        router.refresh();
        onSuccess?.();
      } else {
        onError?.();
      }
    });
  }

  return { updateStatus, isPending };
}
