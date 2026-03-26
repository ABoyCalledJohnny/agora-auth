// components/layout/main.tsx
export function Main({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8">{children}</main>;
}
