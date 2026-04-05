const delays = ["0s", "var(--delay)", "calc(var(--delay)*2)", "calc(var(--delay)*3)"];

export function LoadingDots() {
  return (
    <div className="flex items-center justify-center gap-3 [--delay:calc(var(--duration)/8)] [--duration:1.25s]">
      {delays.map((delay, i) => (
        <div
          key={i}
          className="size-4 origin-bottom animate-[grow_var(--duration)_ease-in-out_infinite_backwards] rounded-full bg-neutral-800"
          style={{ animationDelay: delay }}
        />
      ))}
    </div>
  );
}
