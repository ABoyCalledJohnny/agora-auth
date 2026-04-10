"use client";

import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/src/components/table/Table.tsx";

// ---------------------------------------------------------------------------
// Column Definition
// ---------------------------------------------------------------------------

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
};

// ---------------------------------------------------------------------------
// DataTable
// ---------------------------------------------------------------------------

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  emptyState?: React.ReactNode;
  className?: string;
};

export function DataTable<T>({ columns, rows, keyExtractor, emptyState, className }: DataTableProps<T>) {
  return (
    <Table className={className}>
      <TableHead>
        <TableRow>
          {columns.map((column) => (
            <TableHeaderCell key={column.key} className={column.className}>
              {column.header}
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <tr>
            <TableCell colSpan={columns.length} className="py-8 text-center text-neutral-400">
              {emptyState ?? "No data."}
            </TableCell>
          </tr>
        ) : (
          rows.map((row) => (
            <TableRow key={keyExtractor(row)}>
              {columns.map((column) => (
                <TableCell key={column.key} className={column.className}>
                  {column.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
