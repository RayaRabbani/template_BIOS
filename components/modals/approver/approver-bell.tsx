'use client';

import React from 'react';

import { Bell, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { HistoryItem } from '@/types/approver/modals';

type Props = {
  data: HistoryItem[];
  showOnly?: 'peminjaman' | 'permintaan';
  onSelectItem?: (item: HistoryItem) => void;
};

export default function ApproverBell({ data, showOnly, onSelectItem }: Props) {
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<'peminjaman' | 'permintaan'>(
    showOnly ?? 'peminjaman'
  );

  const pending = data.filter(
    d => d.status === 'pending' && (showOnly ? d.type === showOnly : true)
  );
  const count = pending.length;

  const itemsToShow = data
    .filter(d => (showOnly ? d.type === showOnly : d.type === tab))
    .filter(d => d.status === 'pending');

  const statusSoftColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-white';
      case 'pending':
        return 'bg-yellow-100/70 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'rejected':
        return 'bg-red-100/70 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-blue-100/70 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative cursor-pointer rounded-full border border-gray-300 hover:bg-gray-50 dark:border-neutral-600 dark:hover:bg-neutral-700"
          aria-label={`Pending approvals: ${count}`}
        >
          <Bell size={18} />

          {count > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] text-white shadow">
              {count}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[320px] p-0">
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-semibold">Menunggu Persetujuan</div>
            <div className="text-xs text-neutral-500">{count} Menunggu</div>
          </div>

          {!showOnly && (
            <div className="mb-3 flex rounded-md bg-neutral-100 p-1 dark:bg-neutral-800">
              {(['peminjaman', 'permintaan'] as const).map(t => (
                <button
                  key={t}
                  className={`flex-1 rounded-md py-1 text-sm font-medium transition ${
                    tab === t ? 'bg-black text-white' : 'text-neutral-600'
                  }`}
                  onClick={() => setTab(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          )}

          {itemsToShow.length === 0 ? (
            <div className="text-sm text-neutral-500">
              Tidak ada transaksi status pending.
            </div>
          ) : itemsToShow.length > 3 ? (
            <ScrollArea className="-mx-4 max-h-56">
              <div className="space-y-2 px-4">
                {itemsToShow.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-md border border-neutral-100 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {item.transactionNo}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {item.employee}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${statusSoftColor(
                          item.status
                        )}`}
                        style={
                          item.status === 'approved'
                            ? { backgroundColor: '#01793b' }
                            : {}
                        }
                      >
                        {item.status === 'rejected'
                          ? 'Dibatalkan'
                          : item.status === 'completed'
                            ? 'Selesai'
                            : item.status === 'approved'
                              ? 'Disetujui'
                              : 'Menunggu'}
                      </span>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex size-8 cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white text-black shadow-sm transition hover:bg-gray-100 dark:border-neutral-700 dark:bg-black dark:text-white dark:hover:bg-neutral-800"
                        onClick={() => {
                          onSelectItem?.(item);
                          setOpen(false);
                        }}
                      >
                        <Eye size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="space-y-2">
              {itemsToShow.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-md border border-neutral-100 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {item.transactionNo}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {item.employee}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${statusSoftColor(
                        item.status
                      )}`}
                      style={
                        item.status === 'approved'
                          ? { backgroundColor: '#01793b' }
                          : {}
                      }
                    >
                      {item.status === 'rejected'
                        ? 'Dibatalkan'
                        : item.status === 'completed'
                          ? 'Selesai'
                          : item.status === 'approved'
                            ? 'Disetujui'
                            : 'Menunggu'}
                    </span>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex size-8 cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white text-black shadow-sm transition hover:bg-gray-100 dark:border-neutral-700 dark:bg-black dark:text-white dark:hover:bg-neutral-800"
                      onClick={() => {
                        onSelectItem?.(item);
                        setOpen(false);
                      }}
                    >
                      <Eye size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
