import Image from "next/image";
import Link from "next/link";

import logo from "@/src/assets/agora-logo.svg";
import { Container } from "@/src/components/ui/Container.tsx";

import { AuthStatus } from "./auth-status.tsx";
import { Nav } from "./nav.tsx";

export function Header() {
  return (
    <header id="masthead" className="sticky top-0 z-40 border-b border-neutral-200 bg-white md:h-16">
      <Container className="flex h-full flex-wrap items-center gap-y-4 py-2 md:py-0">
        <div className="flex flex-1 justify-start">
          <Link href="/" className="flex">
            <Image src={logo} alt="Agora - Home" className="h-8 w-auto" />
          </Link>
        </div>
        <Nav />
        <div className="flex flex-1 justify-end">
          <AuthStatus />
        </div>
      </Container>
    </header>
  );
}
