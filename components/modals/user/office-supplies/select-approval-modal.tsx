'use client';

import React from 'react';

import { Search } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { searchEmployeesByRoles } from '@/lib/api/user';
import { cn } from '@/lib/utils';
import type { Approver } from '@/types/user/office-supplies/modals';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  approvers?: Approver[];
  onSelect: (a: Approver) => void;
  selectedId?: number | string | null;
  loading?: boolean;
  roleIds?: string[];
};

export default function SelectApproverModal({
  open,
  onOpenChange,
  approvers = [],
  onSelect,
  selectedId: selectedIdProp = null,
  loading = false,
  roleIds = [],
}: Props) {
  const [query, setQuery] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<number | string | null>(
    selectedIdProp ?? null
  );
  const [searchResults, setSearchResults] = React.useState<Approver[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setSelectedId(selectedIdProp ?? null);
      setQuery('');
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [open, selectedIdProp]);

  // Debounced search function
  const searchEmployees = React.useCallback(
    async (searchTerm: string) => {
      if (!roleIds.length) return;

      setIsSearching(true);
      try {
        const employeeData = await searchEmployeesByRoles(
          roleIds,
          searchTerm.trim()
        );

        // Convert EmployeeApi to Approver format
        const sessionOrgAliases = ['C001370000', '50063620', 'ti', 'tik'];

        const filtered = employeeData.filter(emp => {
          const hasMatchingOrg = emp.organization?.aliases?.some(alias =>
            sessionOrgAliases.includes(alias)
          );
          return hasMatchingOrg;
        });

        const converted: Approver[] = filtered.map(emp => ({
          id: emp.id ? String(emp.id) : '',
          name: emp.name || '',
          nip: emp.id ? String(emp.id) : '',
          avatar: emp.pic || undefined,
        }));

        setSearchResults(converted);
        setHasSearched(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
        setHasSearched(true);
      } finally {
        setIsSearching(false);
      }
    },
    [roleIds]
  );

  // Debounce search
  React.useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchEmployees(query);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, searchEmployees]);

  const fallback: Approver[] = [];

  // Use search results if we have searched, otherwise use provided approvers
  const list = hasSearched
    ? searchResults
    : !loading && approvers.length > 0
      ? approvers
      : fallback;

  // Filter locally only if we're not using backend search results
  const filtered = hasSearched
    ? list
    : list.filter(
        a =>
          a.name.toLowerCase().includes(query.toLowerCase()) ||
          (a.nip || '').toString().includes(query)
      );

  const selected = list.find(l => l.id === selectedId) ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl overflow-hidden rounded-md bg-white p-0 shadow-xl dark:bg-neutral-900 dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]">
        <div className="bg-white px-5 pt-4 pb-0">
          <DialogHeader className="m-0 p-0">
            <DialogTitle className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              Pilih Approval
            </DialogTitle>
          </DialogHeader>
          <div className="relative mt-3">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cari nama atau No Badge..."
              className="h-10 rounded-md border-neutral-200 bg-neutral-50 pl-9 focus:bg-white focus:ring-1 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:ring-emerald-500"
            />
          </div>
        </div>

        <ScrollArea className="max-h-[50vh] min-h-[300px] overflow-hidden bg-neutral-50/30 dark:bg-neutral-900/50">
          <div className="space-y-3 p-4">
            {(loading || isSearching) && (
              <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
                <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-emerald-600 dark:border-neutral-700 dark:border-t-emerald-500" />
                <p className="text-sm">
                  {isSearching ? 'Mencari...' : 'Memuat data approver...'}
                </p>
              </div>
            )}

            {!loading && !isSearching && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-500">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <Search className="h-6 w-6 text-neutral-400" />
                </div>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-200">
                  Tidak ada hasil ditemukan
                </p>
                <p className="mt-1 max-w-[200px] text-xs text-neutral-500 dark:text-neutral-400">
                  {query.trim()
                    ? `Pencarian "${query}" tidak ditemukan.`
                    : 'Silakan cari nama approver'}
                </p>
              </div>
            )}

            {!loading &&
              filtered.map(a => {
                const active = selectedId === a.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    className={cn(
                      'group relative flex cursor-pointer items-center gap-4 rounded-md border p-3 transition-all hover:shadow-md',
                      active
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-sm dark:border-emerald-500/50 dark:bg-emerald-900/10'
                        : 'border-neutral-200 bg-white hover:border-emerald-200 hover:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-emerald-800'
                    )}
                  >
                    <Avatar className="h-10 w-10 border border-neutral-100 dark:border-neutral-700">
                      {a.avatar ? (
                        <AvatarImage
                          src={a.avatar}
                          alt={a.name}
                          className="object-cover object-top w-full h-full"
                        />
                      ) : (
                        <AvatarFallback
                          className={cn(
                            'text-xs font-semibold',
                            active
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                          )}
                        >
                          {a.name
                            .split(' ')
                            .map(n => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'truncate text-sm font-semibold',
                          active
                            ? 'text-emerald-900 dark:text-emerald-50'
                            : 'text-neutral-900 dark:text-neutral-50'
                        )}
                      >
                        {a.name}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        No Badge: {a.nip}
                      </p>
                    </div>

                    <div
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all',
                        active
                          ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500'
                          : 'border-neutral-300 bg-transparent group-hover:border-emerald-400 dark:border-neutral-600'
                      )}
                    >
                      {active && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </ScrollArea>

        <div className="flex justify-end p-4 dark:bg-neutral-900">
          <Button
            variant="outline"
            className="mr-3 h-10 rounded-md border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            className="h-10 min-w-[100px] rounded-md bg-[#01793b] text-white shadow-sm hover:bg-[#016c33] dark:bg-[#01793b] dark:hover:bg-[#043014]"
            onClick={() => {
              if (selected) {
                onSelect(selected);
                onOpenChange(false);
                setQuery('');
                setSelectedId(null);
              }
            }}
            disabled={!selected || loading || isSearching}
          >
            Pilih
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
