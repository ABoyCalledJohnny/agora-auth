import Link from "next/link";

export function Nav() {
  return (
    <nav className="flex items-center gap-4">
      <Link href="/login" className="text-sm text-neutral-600 hover:text-neutral-900">
        Login
      </Link>
      <Link href="/register" className="text-sm text-neutral-600 hover:text-neutral-900">
        Register
      </Link>
    </nav>
  );
}
