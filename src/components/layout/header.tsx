import Link from "next/link";

import { Nav } from "./nav.tsx";

export function Header() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold">
          Agora Auth
        </Link>
        <Nav />
      </div>
    </header>
  );
}
