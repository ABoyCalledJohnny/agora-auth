import { getTranslations } from "next-intl/server";

import { ErrorPage } from "@/src/components/ui/ErrorPage.tsx";

export default async function NotFound() {
  const t = await getTranslations("ErrorPages.notFound");

  return <ErrorPage statusCode={404} heading={t("heading")} description={t("description")} backHome={t("backHome")} />;
}
