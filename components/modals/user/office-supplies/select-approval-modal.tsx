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
      <DialogContent className="w-full max-w-xl overflow-hidden rounded-sm border border-neutral-200 bg-white p-0 shadow-xl dark:border-neutral-700 dark:bg-neutral-900 [&_button[data-slot='dialog-close']]:top-5">
        <div className="px-5 pt-4 pb-0">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              Pilih Approval
            </DialogTitle>
          </DialogHeader>

          <div className="mt-3">
            <div className="relative">
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search Approval..."
                className="border-neutral-200 bg-white pl-10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50"
              />
              <Search
                className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400 dark:text-neutral-400"
                size={18}
              />
            </div>

            <ScrollArea
              className={cn(
                'mt-4',
                filtered.length > 4 ? 'h-[50vh]' : 'h-auto'
              )}
            >
              <div className="space-y-2">
                {(loading || isSearching) && (
                  <p className="py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                    {isSearching ? 'Mencari...' : 'Memuat data approver...'}
                  </p>
                )}

                {!loading && !isSearching && filtered.length === 0 && (
                  <p className="py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                    {hasSearched
                      ? 'Tidak ada hasil ditemukan'
                      : query.trim()
                        ? 'Ketik untuk mencari approver...'
                        : approvers.length === 0
                          ? 'Tidak ada approver yang tersedia'
                          : 'Tidak ada hasil'}
                  </p>
                )}

                {!loading &&
                  filtered.map(a => {
                    const active = selectedId === a.id;

                    return (
                      <Button
                        key={a.id}
                        type="button"
                        onClick={() => setSelectedId(a.id)}
                        variant="ghost"
                        className={`flex min-h-14 w-full cursor-pointer items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                          active
                            ? 'border-neutral-300 bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-700/40'
                            : 'border-neutral-100 bg-white hover:bg-neutral-50 dark:border-neutral-700 dark:bg-transparent dark:hover:bg-neutral-800'
                        } `}
                      >
                        <Avatar className="h-11 w-11 overflow-hidden rounded-full border dark:border-neutral-700">
                          {a.avatar ? (
                            <AvatarImage src={a.avatar} alt={a.name} />
                          ) : (
                            <AvatarFallback>
                              {a.name
                                .split(' ')
                                .map(n => n[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>

                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                            {a.name}
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                            {a.nip}
                          </p>
                        </div>

                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                            active
                              ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                              : 'border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-900'
                          } `}
                        >
                          {active && (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              fill="none"
                            >
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </Button>
                    );
                  })}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-center border-t bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <Button
            className="h-10 w-full max-w-[420px] cursor-pointer rounded-lg bg-black text-white disabled:opacity-60 dark:bg-white dark:text-black"
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
            {loading || isSearching ? 'Memuat...' : 'Pilih'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
