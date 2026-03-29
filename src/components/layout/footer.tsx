export function Footer() {
  return (
    <footer id="colophon" className="border-t border-neutral-200 bg-white py-6">
      <div className="container flex flex-col items-center gap-2 text-center text-sm text-neutral-500">
        <p className="flex items-center gap-1">
          Made with
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 640 640"
            aria-hidden="true"
            className="inline-block h-4 w-4 fill-red-500"
          >
            <path d="M305 151.1L320 171.8L335 151.1C360 116.5 400.2 96 442.9 96C516.4 96 576 155.6 576 229.1L576 231.7C576 343.9 436.1 474.2 363.1 529.9C350.7 539.3 335.5 544 320 544C304.5 544 289.2 539.4 276.9 529.9C203.9 474.2 64 343.9 64 231.7L64 229.1C64 155.6 123.6 96 197.1 96C239.8 96 280 116.5 305 151.1z" />
          </svg>
          in the Birdy Mountain Range.
        </p>
        <p>&copy; {new Date().getFullYear()} Agora Auth</p>
      </div>
    </footer>
  );
}
