import { Container } from "@/src/components/ui/Container.tsx";

export function Main({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className="flex-1 bg-neutral-50">
      <Container className="py-8">{children}</Container>
    </main>
  );
}
