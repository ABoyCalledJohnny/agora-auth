"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/src/components/ui/Button.tsx";
import { logoutAction } from "@/src/features/auth/actions/logout.action.ts";

export function AlreadyLoggedIn() {
  const t = useTranslations("Auth.Login");

  return (
    <>
      <h2>{t("heading")}</h2>
      <p className="text-neutral-600">{t("alreadyLoggedIn")}</p>
      <form
        action={async () => {
          await logoutAction();
        }}
      >
        <Button type="submit" variant="secondary">
          {t("logout")}
        </Button>
      </form>
    </>
  );
}
