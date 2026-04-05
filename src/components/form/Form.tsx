import { Alert } from "@/src/components/ui/Alert.tsx";
import { cn } from "@/src/lib/utils.ts";

type FormProps = React.ComponentProps<"form"> & {
  error?: string | undefined;
};

export function Form({ children, error, className, ...rest }: FormProps) {
  return (
    <form className={cn("flex flex-col gap-4", className)} {...rest}>
      {error && <Alert>{error}</Alert>}
      {children}
    </form>
  );
}
