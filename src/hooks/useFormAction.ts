import type { ApiResponse } from "@/src/types.ts";

import { useActionState } from "react";

type ZodFieldErrors = Record<string, string[] | undefined>;

function hasFieldErrors(details: unknown): details is { fieldErrors: ZodFieldErrors } {
  return typeof details === "object" && details !== null && "fieldErrors" in details;
}

export function useFormAction<TData>(action: (formData: FormData) => Promise<ApiResponse<TData>>) {
  const [state, formAction, isPending] = useActionState(
    (_prev: ApiResponse<TData> | null, formData: FormData) => action(formData),
    null,
  );

  const errorState = state && !state.success ? state : null;

  return {
    state,
    formAction,
    isPending,
    errorCode: errorState?.code,
    fieldErrors: errorState && hasFieldErrors(errorState.details) ? errorState.details.fieldErrors : undefined,
  };
}
