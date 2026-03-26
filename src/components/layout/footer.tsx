export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white py-6">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-neutral-500">
        &copy; {new Date().getFullYear()} Agora Auth
      </div>
    </footer>
  );
}
