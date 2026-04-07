"use client";

import type { AppSession } from "@/src/lib/auth.ts";

import { createContext, useContext } from "react";

type SessionContextValue = {
  session: AppSession | null;
};

const SessionContext = createContext<SessionContextValue>({ session: null });

export function SessionProvider({ session, children }: { session: AppSession | null; children: React.ReactNode }) {
  return <SessionContext value={{ session }}>{children}</SessionContext>;
}

export function useSession() {
  return useContext(SessionContext);
}
