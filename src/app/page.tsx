import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

import logo from "@/src/assets/agora-logo.svg";
import { CenteredLayout } from "@/src/components/layout/centered-layout.tsx";
import { buttonVariants } from "@/src/components/ui/Button.tsx";
import { Card } from "@/src/components/ui/Card.tsx";
import { appConfig } from "@/src/config/index.ts";
import { getSession } from "@/src/lib/auth.ts";

export default async function Page() {
  const t = await getTranslations("Landing");
  const session = await getSession();

  return (
    <CenteredLayout className="flex-1">
      <Card className="w-md max-w-full items-center text-center">
        <Image src={logo} alt="Agora Auth" className="h-10 w-auto" />
        <p className="text-lg font-medium text-neutral-800">{appConfig.app.tagline}</p>
        <p className="text-sm text-neutral-500">{t("description")}</p>
        <div className="flex gap-3">
          {!session && (
            <Link href="/login" className={buttonVariants()}>
              {t("login")}
            </Link>
          )}
          <Link href="/docs" className={buttonVariants({ variant: "secondary" })}>
            {t("docs")}
          </Link>
        </div>
      </Card>
    </CenteredLayout>
  );
}
