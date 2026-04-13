import { cn } from "@/src/lib/utils.ts";

// ---------------------------------------------------------------------------
// Table Root — horizontal scroll wrapper + styled <table>
// ---------------------------------------------------------------------------

type TableProps = React.ComponentProps<"table">;

export function Table({ children, className, ...rest }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className={cn("w-full text-left text-sm", className)} {...rest}>
        {children}
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table Head
// ---------------------------------------------------------------------------

type TableHeadProps = React.ComponentProps<"thead">;

export function TableHead({ children, className, ...rest }: TableHeadProps) {
  return (
    <thead
      className={cn("border-b border-neutral-200 bg-neutral-50 text-xs font-medium text-neutral-700", className)}
      {...rest}
    >
      {children}
    </thead>
  );
}

// ---------------------------------------------------------------------------
// Table Body
// ---------------------------------------------------------------------------

type TableBodyProps = React.ComponentProps<"tbody">;

export function TableBody({ children, className, ...rest }: TableBodyProps) {
  return (
    <tbody className={cn("divide-y divide-neutral-100", className)} {...rest}>
      {children}
    </tbody>
  );
}

// ---------------------------------------------------------------------------
// Table Row
// ---------------------------------------------------------------------------

type TableRowProps = React.ComponentProps<"tr">;

export function TableRow({ children, className, ...rest }: TableRowProps) {
  return (
    <tr className={cn("transition-colors hover:bg-neutral-50", className)} {...rest}>
      {children}
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Table Header Cell
// ---------------------------------------------------------------------------

type TableHeaderCellProps = React.ComponentProps<"th">;

export function TableHeaderCell({ children, className, ...rest }: TableHeaderCellProps) {
  return (
    <th scope="col" className={cn("px-3 py-3 whitespace-nowrap", className)} {...rest}>
      {children}
    </th>
  );
}

// ---------------------------------------------------------------------------
// Table Cell
// ---------------------------------------------------------------------------

type TableCellProps = React.ComponentProps<"td">;

export function TableCell({ children, className, ...rest }: TableCellProps) {
  return (
    <td className={cn("px-3 py-3 whitespace-nowrap text-neutral-700", className)} {...rest}>
      {children}
    </td>
  );
}
