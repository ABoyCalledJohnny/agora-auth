import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useAdminUsers() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);

  const setPage = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(newPage));
      router.push(`/admin?${params.toString()}`);
    },
    [router, searchParams],
  );

  return { page, limit, setPage };
}
