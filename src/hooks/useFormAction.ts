import type { ActionResult } from "@/src/lib/action-wrapper.ts";

import { useActionState } from "react";

type ZodFieldErrors = Record<string, string[] | undefined>;

function hasFieldErrors(details: unknown): details is { fieldErrors: ZodFieldErrors } {
  return typeof details === "object" && details !== null && "fieldErrors" in details;
}

export function useFormAction<TData>(action: (formData: FormData) => Promise<ActionResult<TData>>) {
  const [state, formAction, isPending] = useActionState(
    (_prev: ActionResult<TData> | null, formData: FormData) => action(formData),
    null,
  );

  const errorState = state && !state.success ? state : null;

  return {
    state,
    formAction,
    isPending,
    formError: errorState?.error,
    fieldErrors: errorState && hasFieldErrors(errorState.details) ? errorState.details.fieldErrors : undefined,
  };
}
