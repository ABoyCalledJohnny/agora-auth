"use client";

import { useTranslations } from "next-intl";

import { ErrorPage } from "@/src/components/ui/ErrorPage.tsx";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("ErrorPages.error");

  return (
    <ErrorPage statusCode={500} heading={t("heading")} description={t("description")} backHome={t("backHome")}>
      <button
        onClick={() => reset()}
        className="cursor-pointer text-sm font-medium text-teal-500 transition-colors hover:text-teal-600"
      >
        {t("tryAgain")}
      </button>
    </ErrorPage>
  );
}
