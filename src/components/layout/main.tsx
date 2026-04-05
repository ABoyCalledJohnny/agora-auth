import { Container } from "@/src/components/ui/Container.tsx";

export function Main({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className="flex flex-1 flex-col bg-neutral-50">
      <Container className="flex flex-1 flex-col py-8">{children}</Container>
    </main>
  );
}
