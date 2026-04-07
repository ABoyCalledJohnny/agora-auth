"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Form } from "@/src/components/form/Form.tsx";
import { InputField } from "@/src/components/form/InputField.tsx";
import { PasswordField } from "@/src/components/form/PasswordField.tsx";
import { Button } from "@/src/components/ui/Button.tsx";
import { loginAction } from "@/src/features/auth/actions/login.action.ts";
import { useFormAction } from "@/src/hooks/useFormAction.ts";

export function LoginForm() {
  const t = useTranslations("Auth.Login");
  const tErrors = useTranslations("Errors");
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") ?? "";
  const redirectTo = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "";

  const { formAction, isPending, errorCode, fieldErrors } = useFormAction(loginAction);

  return (
    <>
      <h2 className="text-center">{t("heading")}</h2>
      <Form action={formAction} error={errorCode ? tErrors(errorCode) : undefined}>
        {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

        <InputField
          name="identifier"
          label={t("identifierLabel")}
          type="text"
          placeholder={t("identifierPlaceholder")}
          autoComplete="username"
          required
          error={fieldErrors?.identifier?.[0]}
        />

        <PasswordField
          name="password"
          label={t("passwordLabel")}
          placeholder={t("passwordPlaceholder")}
          autoComplete="current-password"
          required
          error={fieldErrors?.password?.[0]}
        />

        <Button type="submit" pending={isPending}>
          {isPending ? t("submitting") : t("submit")}
        </Button>
      </Form>

      <div className="mt-4 flex flex-col gap-1.5 text-center text-sm text-neutral-500">
        <p className="">
          <Link href="/forgot-password" className="link-accent">
            {t("forgotPassword")}
          </Link>
        </p>
        <p className="">
          {t("noAccount")}{" "}
          <Link href="/register" className="link-accent">
            {t("noAccountLink")}
          </Link>
        </p>
      </div>
    </>
  );
}
