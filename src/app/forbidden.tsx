import { getTranslations } from "next-intl/server";

import { ErrorPage } from "@/src/components/ui/ErrorPage.tsx";

export default async function Forbidden() {
  const t = await getTranslations("ErrorPages.forbidden");

  return <ErrorPage statusCode={403} heading={t("heading")} description={t("description")} backHome={t("backHome")} />;
}
