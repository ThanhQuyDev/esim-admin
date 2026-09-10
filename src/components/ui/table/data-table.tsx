import { type Row, type Table as TanstackTable, flexRender } from '@tanstack/react-table';
import type * as React from 'react';

import { DataTablePagination } from '@/components/ui/table/data-table-pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { getCommonPinningStyles } from '@/lib/data-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface DataTableProps<TData> extends React.ComponentProps<'div'> {
  table: TanstackTable<TData>;
  actionBar?: React.ReactNode;
  totalRowCount?: number;
  /**
   * Extra classes for one row, by its data — for rows that are still worth
   * listing but should not read as live (a rejected partner, say). Optional, so
   * every existing table renders exactly as before.
   */
  rowClassName?: (row: Row<TData>) => string | undefined;
}

export function DataTable<TData>({
  table,
  actionBar,
  children,
  totalRowCount,
  rowClassName
}: DataTableProps<TData>) {
  return (
    <div className='flex flex-1 flex-col space-y-4'>
      {children}
      {/*
        Desktop pins the table to the remaining space and scrolls INSIDE the
        ScrollArea (`lg:absolute inset-0` + `lg:h-full`).

        Mobile must not do that. The ScrollArea has no bounded height below
        `lg`, so it grows to its content — clipping the wrapper at a fixed
        height with `overflow-hidden` (as this used to do with
        `max-h-[70vh]`) simply cut the rows off with no way to reach them.
        Instead the table keeps its natural height on mobile and the page
        itself scrolls, which is also the friendlier gesture on touch: no
        nested vertical scroll area to fight with. Horizontal scrolling for
        wide tables still happens inside the ScrollArea's own viewport.
      */}
      <div className='relative flex flex-1 lg:min-h-0'>
        <div className='flex w-full rounded-lg border lg:absolute lg:inset-0 lg:overflow-hidden'>
          <ScrollArea className='w-full lg:h-full'>
            <Table>
              <TableHeader className='bg-muted sticky top-0 z-10'>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        style={{
                          ...getCommonPinningStyles({ column: header.column })
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className={rowClassName?.(row)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          style={{
                            ...getCommonPinningStyles({ column: cell.column })
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={table.getAllColumns().length} className='h-24 text-center'>
                      Không có kết quả.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation='horizontal' />
          </ScrollArea>
        </div>
      </div>
      <div className='flex flex-col gap-2.5'>
        <DataTablePagination table={table} totalRowCount={totalRowCount} />
        {actionBar && table.getFilteredSelectedRowModel().rows.length > 0 && actionBar}
      </div>
    </div>
  );
}
