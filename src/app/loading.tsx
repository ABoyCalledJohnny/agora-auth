import { CenteredLayout } from "@/src/components/layout/centered-layout.tsx";
import { LoadingDots } from "@/src/components/ui/LoadingDots.tsx";

export default function Loading() {
  return (
    <CenteredLayout className="flex-1">
      <LoadingDots />
    </CenteredLayout>
  );
}
