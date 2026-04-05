import type { Metadata } from "next";

import { getTranslations } from "next-intl/server";

import { CenteredLayout } from "@/src/components/layout/centered-layout.tsx";
import { Card } from "@/src/components/ui/Card.tsx";

import { LoginForm } from "./login-form.tsx";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.Login");
  return {
    title: t("heading"),
    description: t("metaDescription"),
  };
}

export default function Page() {
  return (
    <CenteredLayout className="flex-1">
      <Card className="w-full max-w-md">
        <LoginForm />
      </Card>
    </CenteredLayout>
  );
}
