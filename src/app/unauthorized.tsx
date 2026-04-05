import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { ErrorPage } from "@/src/components/ui/ErrorPage.tsx";

export default async function Unauthorized() {
  const t = await getTranslations("ErrorPages.unauthorized");

  return (
    <ErrorPage statusCode={401} heading={t("heading")} description={t("description")} backHome={t("backHome")}>
      <Link href="/login" className="text-sm font-medium text-teal-500 transition-colors hover:text-teal-600">
        {t("logIn")}
      </Link>
    </ErrorPage>
  );
}
