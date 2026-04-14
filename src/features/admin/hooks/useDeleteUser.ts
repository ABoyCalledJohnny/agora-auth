import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deleteUserAction } from "../actions/delete-user.action.ts";

type DeleteUserCallbacks = {
  onSuccess?: () => void;
  onError?: () => void;
};

export function useDeleteUser() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function deleteUser(userId: string, { onSuccess, onError }: DeleteUserCallbacks = {}) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("userId", userId);

      const result = await deleteUserAction(formData);

      if (result.success) {
        router.refresh();
        onSuccess?.();
      } else {
        onError?.();
      }
    });
  }

  return { deleteUser, isPending };
}
