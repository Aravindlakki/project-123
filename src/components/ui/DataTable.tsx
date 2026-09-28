import React from 'react';
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  emptyMessage?: string;
  isLoading?: boolean;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  // Optional pagination
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalItems?: number;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No records found',
  isLoading = false,
  sortKey,
  sortDirection,
  onSort,
  page,
  totalPages,
  onPageChange,
  totalItems,
  className = '',
}: DataTableProps<T>) {
  return (
    <div
      className={`w-full overflow-hidden rounded-2xl border border-neutral-800/80 bg-[#0B0F19] shadow-xl ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm text-neutral-300 border-collapse">
          <thead className="bg-[#0F1422] text-neutral-400 font-semibold uppercase tracking-wider text-[11px] border-b border-neutral-800/80 select-none">
            <tr>
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                const alignClass =
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left';

                return (
                  <th
                    key={col.key}
                    scope="col"
                    onClick={() => col.sortable && onSort?.(col.key)}
                    className={`py-3.5 px-4 font-bold whitespace-nowrap ${alignClass} ${
                      col.sortable ? 'cursor-pointer hover:text-white transition-colors' : ''
                    } ${col.className || ''}`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''
                      }`}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-neutral-500">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5 text-purple-400" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-purple-400" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60 font-normal">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-neutral-400">
                  <div className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                    <span>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-neutral-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, rowIdx) => (
                <tr
                  key={keyExtractor(item, rowIdx)}
                  className="hover:bg-white/[0.03] transition-colors duration-100"
                >
                  {columns.map((col) => {
                    const alignClass =
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left';

                    return (
                      <td
                        key={col.key}
                        className={`py-3.5 px-4 align-middle ${alignClass} ${col.className || ''}`}
                      >
                        {col.render ? col.render(item, rowIdx) : (item as any)[col.key]}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages !== undefined && totalPages > 1 && onPageChange && page !== undefined && (
        <div className="px-4 py-3 border-t border-neutral-800/80 bg-[#0F1422] flex items-center justify-between text-xs text-neutral-400">
          <div>
            {totalItems !== undefined && (
              <span>
                Total <span className="font-mono tabular-nums text-neutral-200">{totalItems}</span>{' '}
                records
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono tabular-nums">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="p-1 rounded-lg border border-neutral-700 hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="p-1 rounded-lg border border-neutral-700 hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
