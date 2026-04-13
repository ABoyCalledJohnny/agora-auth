import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deleteUserAction } from "../actions/delete-user.action.ts";

export function useDeleteUser() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function deleteUser(userId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("userId", userId);

      const result = await deleteUserAction(formData);

      if (result.success) {
        router.refresh();
      }
    });
  }

  return { deleteUser, isPending };
}
