'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { format } from 'date-fns';
import {
  CalendarIcon,
  ChevronsUpDown,
  ClipboardCopy,
  Info,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  createTransaksiPermintaanConsumable,
  getEmployeeById,
  getEmployeesByRoles,
  sendApproverNotification,
} from '@/lib/api/user';
import { cn } from '@/lib/utils';
import { ConfirmFormData } from '@/types/confirm-form-data';
import type { EmployeeApi } from '@/types/employee';
import type { Approver } from '@/types/user/office-supplies/modals';

import SelectApproverModal from './select-approval-modal';

type Props = {
  open: boolean;
  setOpen: (val: boolean) => void;
  type: 'peminjaman' | 'permintaan';
  source?: string;
  onSubmit: (data: ConfirmFormData) => void;
  onRefresh?: () => Promise<void>;
};

export default function ConfirmModal({
  open,
  setOpen,
  onSubmit,
  onRefresh,
}: Props) {
  const [openSelect, setOpenSelect] = useState(false);
  const [selectedApprover, setSelectedApprover] = useState<Approver | null>(
    null
  );

  const [tanggalPermintaan, setTanggalPermintaan] = useState<
    Date | undefined
  >();
  const [tanggalPermintaanOpen, setTanggalPermintaanOpen] = useState(false);

  const [employees, setEmployees] = useState<EmployeeApi[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeData, setEmployeeData] = useState<{
    kode_unit: string;
    no_badge: string;
    nama: string;
    pic: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();

  const approverRoleIds = useMemo(
    () => [
      '50002164',
      '50002165',
      '50002166',
      '50041882',
      '50002167',
      '50002168',
      '50002169',
      '50004426',
      '50007218',
      '50044399',
      '50064005',
      '50092251',
      '50118222',
      '50118224',
      '50118228',
      '50118229',
      '50118232',
      'Jr AVP',
    ],
    []
  );

  const fetchApprovers = useCallback(async () => {
    if (!open) return;

    setLoadingEmployees(true);
    try {
      const employeeData = await getEmployeesByRoles(approverRoleIds);
      setEmployees(employeeData);
    } catch (err: unknown) {
      console.error('Failed to fetch approvers:', err);
    } finally {
      setLoadingEmployees(false);
    }
  }, [open, approverRoleIds]);

  useEffect(() => {
    fetchApprovers();

    const fetchEmployeeData = async () => {
      if (!open) return;

      try {
        const emp = await getEmployeeById(session?.user?.id || '0');
        if (emp) {
          setEmployeeData({
            kode_unit: emp.organization?.id ? String(emp.organization.id) : '',
            no_badge: emp.id ? String(emp.id) : '',
            nama: emp.name || '',
            pic: emp.pic || '',
          });
        }
      } catch (err) {
        console.warn('Failed to fetch employee from demplon:', err);
      }
    };

    fetchEmployeeData();
  }, [fetchApprovers, open]);

  const approvers = useMemo(() => {
    if (!employees.length) return [];

    const sessionOrgAliases = ['C001370000', '50063620', 'ti', 'tik'];

    const filtered = employees.filter(emp => {
      const hasMatchingOrg = emp.organization?.aliases?.some(alias =>
        sessionOrgAliases.includes(alias)
      );

      return hasMatchingOrg;
    });

    return filtered.map(
      (emp): Approver => ({
        id: emp.id || '',
        name: emp.name || '',
        nip: String(emp.id || ''),
        avatar: emp.pic || undefined,
      })
    );
  }, [employees]);

  const form = useForm<{
    tanggalPermintaan?: string;
    catatan?: string;
    approverId?: string | number;
  }>({
    defaultValues: { tanggalPermintaan: '', catatan: '', approverId: '' },
  });

  const handleSubmit = () => {
    const submit = async () => {
      const values = form.getValues();
      const ok = await form.trigger();
      if (!ok) return;

      setIsSubmitting(true);

      try {
        if (employeeData && selectedApprover) {
          const payload = {
            no_badge: employeeData.no_badge,
            nama: employeeData.nama,
            pic: employeeData.pic,
            no_badge_approval: selectedApprover.nip,
            nama_approval: selectedApprover.name,
            pic_approval: selectedApprover.avatar || '',
            tgl_permintaan: values.tanggalPermintaan || '',
            catatan: values.catatan || '',
            approval: 'Pending',
          };

          await createTransaksiPermintaanConsumable(payload);
          toast.success(
            'Transaksi permintaan office supplies berhasil dibuat!'
          );
          try {
            await sendApproverNotification({
              channels: ['inbox'],
              employeeIds: [String(selectedApprover.nip)],
              type: 'info',
              category: 'general',
              title: `Permintaan Office Supplies dari ${employeeData.nama}`,
              body: `Terdapat permintaan office supplies oleh ${employeeData.nama} (No Badge: ${employeeData.no_badge}). Catatan: ${values.catatan || '-'}. Silakan cek dan lakukan persetujuan melalui menu BIOS.`,
            });
          } catch (err) {
            console.warn('Failed to send approver notification:', err);
          }

          if (onRefresh) {
            await onRefresh();
          }
        }

        onSubmit({
          tanggalPinjam: '',
          tanggalKembali: '',
          tanggalPermintaan: values.tanggalPermintaan || '',
          lokasi: '',
          unitKerja: '',
          catatan: values.catatan || '',
          approver: selectedApprover ?? undefined,
        });

        setOpen(false);
      } catch (error) {
        console.error('Failed to submit:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Terjadi kesalahan';
        toast.error(
          `Gagal membuat transaksi permintaan office supplies: ${errorMessage}`
        );
      } finally {
        setIsSubmitting(false);
      }
    };

    submit();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg overflow-hidden rounded-sm bg-white p-0 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] dark:bg-neutral-900 dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] [&_button[data-slot='dialog-close']]:top-5.5">
          <div className="bg-white px-6 pt-4 dark:bg-neutral-900">
            <DialogHeader className="m-0 p-0">
              <DialogTitle className="text-xl text-neutral-900 dark:text-neutral-50">
                Konfirmasi Permintaan Barang
              </DialogTitle>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Silakan isi detail berikut sebelum mengajukan permintaan barang.
              </p>
            </DialogHeader>
          </div>

          <ScrollArea className="max-h-[55vh] overflow-hidden rounded-t-sm">
            <div className="mb-0 space-y-4 bg-neutral-50/60 px-6 pt-3 pb-0 text-neutral-900 dark:bg-neutral-900/80 dark:text-neutral-50">
              <Form {...form}>
                <Alert className="rounded-sm border bg-blue-50 p-5 shadow-sm dark:border-blue-800 dark:bg-blue-900/20">
                  <Info className="!h-5 !w-5 text-blue-900 dark:text-blue-200" />
                  <AlertTitle className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                    Informasi permintaan Asset
                  </AlertTitle>

                  <AlertDescription className="mt-1 text-sm leading-relaxed text-blue-900/80 dark:text-blue-200/80">
                    Jika Proses Persetujuan Permintaan Asset Tidak Ada Tindakan
                    dari Atasan Selama 1×24 Jam, Maka Proses Persetujuan Akan
                    Disetujui oleh Sistem!
                  </AlertDescription>
                </Alert>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    <span className="mr-1 text-red-500">*</span>Tanggal
                    Permintaan
                  </label>

                  <Popover
                    open={tanggalPermintaanOpen}
                    onOpenChange={setTanggalPermintaanOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'h-11 w-full cursor-pointer justify-start rounded-sm border border-neutral-200 bg-white text-left font-normal dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50',
                          !tanggalPermintaan && 'text-neutral-400'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {tanggalPermintaan
                          ? format(tanggalPermintaan, 'PPP')
                          : 'Pilih tanggal...'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        captionLayout="dropdown"
                        fromYear={2025}
                        toYear={2030}
                        selected={tanggalPermintaan}
                        onSelect={d => {
                          setTanggalPermintaan(d);
                          form.setValue(
                            'tanggalPermintaan',
                            d ? format(d, 'yyyy-MM-dd') : ''
                          );
                          form.clearErrors('tanggalPermintaan');
                          setTanggalPermintaanOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.tanggalPermintaan && (
                    <p className="mt-1 text-xs text-red-600">
                      {
                        form.formState.errors.tanggalPermintaan
                          ?.message as string
                      }
                    </p>
                  )}

                  <input
                    type="hidden"
                    {...form.register('tanggalPermintaan', {
                      required: 'Tanggal permintaan wajib diisi.',
                    })}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="catatan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan (Opsional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          placeholder="Tambahkan catatan..."
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="mb-4">
                  <p className="mb-2 text-sm font-medium">
                    <span className="mr-1 text-red-500">*</span>
                    Atasan yang Menyetujui
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenSelect(true)}
                    className="flex h-11 w-full cursor-pointer items-center justify-between rounded-sm border border-neutral-200 bg-white px-3 text-left dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {selectedApprover?.avatar ? (
                            <AvatarImage
                              src={selectedApprover.avatar}
                              alt={selectedApprover.name ?? 'avatar'}
                            />
                          ) : (
                            <AvatarFallback>
                              {selectedApprover?.name
                                ? selectedApprover.name
                                    .split(' ')
                                    .map(n => n[0])
                                    .slice(0, 2)
                                    .join('')
                                    .toUpperCase()
                                : '?'}
                            </AvatarFallback>
                          )}
                        </Avatar>

                        <div className="truncate text-sm text-neutral-700 dark:text-neutral-50">
                          {selectedApprover
                            ? `${selectedApprover.name} (${selectedApprover.nip})`
                            : 'Pilih atasan yang menyetujui'}
                        </div>
                      </div>
                    </div>

                    <ChevronsUpDown className="h-4 w-4 text-neutral-400 dark:text-neutral-300" />
                  </Button>

                  {form.formState.errors.approverId && (
                    <p className="mt-1 text-xs text-red-600">
                      {form.formState.errors.approverId.message as string}
                    </p>
                  )}

                  <input
                    type="hidden"
                    {...form.register('approverId', {
                      required: 'Pilih atasan yang menyetujui.',
                    })}
                  />
                </div>
              </Form>
            </div>
          </ScrollArea>

          <div className="flex justify-end bg-white px-3 pt-0 pb-3 dark:border-neutral-700 dark:bg-neutral-900">
            <Button
              className="h-9 cursor-pointer rounded-sm bg-[#01793b] px-8 text-sm font-medium text-white shadow-sm hover:bg-[#016c33] dark:bg-[##01793b] dark:text-white dark:hover:bg-[#043014]"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              <ClipboardCopy className="h-4 w-4" />
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SelectApproverModal
        open={openSelect}
        onOpenChange={setOpenSelect}
        selectedId={selectedApprover?.id ?? null}
        onSelect={a => {
          setSelectedApprover(a);
          form.setValue('approverId', a?.id ?? '');
          form.clearErrors('approverId');
        }}
        approvers={approvers}
        loading={loadingEmployees}
        roleIds={approverRoleIds}
      />
    </>
  );
}
