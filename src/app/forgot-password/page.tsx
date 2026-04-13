import type { Metadata } from "next";

import { getTranslations } from "next-intl/server";

import { CenteredLayout } from "@/src/components/layout/centered-layout.tsx";
import { Card } from "@/src/components/ui/Card.tsx";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.ForgotPassword");
  return {
    title: t("heading"),
    description: t("metaDescription"),
  };
}

export default async function Page() {
  const t = await getTranslations("Auth.ForgotPassword");
  const tCommon = await getTranslations("Common");

  return (
    <CenteredLayout className="flex-1">
      <Card className="w-full max-w-[360] text-center">
        <h2 className="text-center">{t("heading")}</h2>
        <p className="text-center">{tCommon("notImplemented")}</p>
      </Card>
    </CenteredLayout>
  );
}
