export function Main({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className="flex-1">
      <div className="container py-8">{children}</div>
    </main>
  );
}
