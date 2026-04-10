import Image from "next/image";
import Link from "next/link";

import logo from "@/src/assets/agora-logo.svg";
import { Container } from "@/src/components/ui/Container.tsx";

import { AuthStatus } from "./auth-status.tsx";
import { Nav } from "./nav.tsx";

export function Header() {
  return (
    <header id="masthead" className="sticky top-0 z-40 h-16 border-b border-neutral-200 bg-white">
      <Container className="relative flex h-full items-center justify-between">
        <Link href="/" className="flex">
          <Image src={logo} alt="Agora - Home" className="h-8 w-auto" />
        </Link>
        <div className="absolute left-1/2 -translate-x-1/2">
          <Nav />
        </div>
        <AuthStatus />
      </Container>
    </header>
  );
}
