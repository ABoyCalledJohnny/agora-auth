import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { navRoutes } from "@/src/config/routes.ts";

export async function Nav() {
  const t = await getTranslations("Nav");

  return (
    <nav className="order-last flex w-full justify-center gap-3 md:order-0 md:w-auto">
      {navRoutes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-600 transition-[background-color] duration-200 ease-in-out hover:bg-neutral-100"
        >
          {t(route.labelKey)}
        </Link>
      ))}
    </nav>
  );
}
