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
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") ?? "";
  const redirectTo = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "";

  const { formAction, isPending, formError, fieldErrors } = useFormAction(loginAction);

  return (
    <>
      <h2 className="text-center">{t("heading")}</h2>
      <Form action={formAction} error={formError}>
        {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

        <InputField
          name="identifier"
          label={t("emailLabel")}
          type="text"
          placeholder={t("emailPlaceholder")}
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

        <div className="flex items-center justify-end">
          <Link href="/forgot-password" className="text-sm text-teal-500 hover:text-teal-600">
            {t("forgotPassword")}
          </Link>
        </div>

        <Button type="submit" pending={isPending} className="w-full">
          {isPending ? t("submitting") : t("submit")}
        </Button>
      </Form>

      <p className="mt-4 text-center text-sm text-neutral-500">
        {t("noAccount")}{" "}
        <Link href="/register" className="text-teal-500 hover:text-teal-600">
          {t("noAccountLink")}
        </Link>
      </p>
    </>
  );
}
