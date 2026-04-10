import { Input } from "@/src/components/form/Input.tsx";
import { Label } from "@/src/components/form/Label.tsx";

type InputFieldProps = React.ComponentProps<"input"> & {
  label: string;
  error?: string | undefined;
};

export function InputField({ label, error, id, name, className, ...rest }: InputFieldProps) {
  const fieldId = id ?? name ?? label.toLowerCase().replace(/\s+/g, "-");
  const errorId = `${fieldId}-error`;

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={fieldId}>{label}</Label>
      <Input
        id={fieldId}
        name={name ?? fieldId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={className}
        {...rest}
      />
      {error && (
        <p id={errorId} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
