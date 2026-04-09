import type { Metadata } from "next";

import { getTranslations } from "next-intl/server";

import { CenteredLayout } from "@/src/components/layout/centered-layout.tsx";
import { Card } from "@/src/components/ui/Card.tsx";
import { getSession } from "@/src/lib/auth.ts";
import { cn } from "@/src/lib/utils.ts";

import { AlreadyLoggedIn } from "./already-logged-in.tsx";
import { LoginForm } from "./login-form.tsx";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth.Login");
  return {
    title: t("heading"),
    description: t("metaDescription"),
  };
}

export default async function Page() {
  const session = await getSession();

  return (
    <CenteredLayout className="flex-1">
      <Card className={cn("w-full max-w-md", session ? "text-center" : "")}>
        {session ? <AlreadyLoggedIn /> : <LoginForm />}
      </Card>
    </CenteredLayout>
  );
}
