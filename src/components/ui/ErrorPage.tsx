import Link from "next/link";

import { CenteredLayout } from "@/src/components/layout/centered-layout.tsx";

type ErrorPageProps = {
  statusCode: number;
  heading: string;
  description: string;
  backHome: string;
  children?: React.ReactNode;
};

export function ErrorPage({ statusCode, heading, description, backHome, children }: ErrorPageProps) {
  return (
    <CenteredLayout className="flex-1 flex-col text-center">
      <p className="text-8xl font-bold text-neutral-200">{statusCode}</p>
      <h2 className="mt-4 text-xl font-semibold text-neutral-800">{heading}</h2>
      <p className="mt-2 text-sm text-neutral-500">{description}</p>
      <div className="mt-6 flex gap-4">
        {children}
        <Link href="/" className="text-sm font-medium text-teal-500 transition-colors hover:text-teal-600">
          {backHome}
        </Link>
      </div>
    </CenteredLayout>
  );
}
