import Image from "next/image";
import Link from "next/link";

import logo from "@/src/assets/agora-logo.svg";

import { Nav } from "./nav.tsx";

export function Header() {
  return (
    <header id="masthead" className="">
      <div className="container flex h-18 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex">
            {/* <Image src={icon} alt="Agora – Home" className="h-8 w-auto" /> */}
            <Image src={logo} alt="Agora – Home" className="h-8 w-auto" />
          </Link>
          <Nav />
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-neutral-600 hover:text-neutral-900">
            Login
          </Link>
        </div>
      </div>
    </header>
  );
}
