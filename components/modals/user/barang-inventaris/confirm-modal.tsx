'use client';

import { useEffect, useState } from 'react';

import { format } from 'date-fns';
import { CalendarIcon, ClipboardCopy, Info } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  createTransaksiPeminjaman,
  createTransaksiPermintaan,
  getEmployeeById,
  getLokasiByUnit,
  getUnits,
  sendApproverNotification,
} from '@/lib/api/user';
import { cn } from '@/lib/utils';
import { ConfirmFormData } from '@/types/confirm-form-data';
import type { LokasiApiItem } from '@/types/user/barang-inventaris/modals';

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
  type,
  onSubmit,
  source,
  onRefresh,
}: Props) {
  const isPermintaan = type === 'permintaan';

  const [tanggalPinjam, setTanggalPinjam] = useState<Date | undefined>();
  const [tanggalKembali, setTanggalKembali] = useState<Date | undefined>();
  const [tanggalPermintaan, setTanggalPermintaan] = useState<
    Date | undefined
  >();

  const [waktuPinjam, setWaktuPinjam] = useState<string>('');
  const [waktuKembali, setWaktuKembali] = useState<string>('');
  const [tanggalPinjamOpen, setTanggalPinjamOpen] = useState(false);
  const [tanggalKembaliOpen, setTanggalKembaliOpen] = useState(false);
  const [tanggalPermintaanOpen, setTanggalPermintaanOpen] = useState(false);

  const [lokasi, setLokasi] = useState('');
  const [unitKerja, setUnitKerja] = useState('');
  const [lokasiOptions, setLokasiOptions] = useState<LokasiApiItem[]>([]);
  const [leaderBadge, setLeaderBadge] = useState<string | null>(null);
  const [leaderName, setLeaderName] = useState<string | null>(null);
  const [leaderPic, setLeaderPic] = useState<string | null>(null);
  const [units, setUnits] = useState<Array<Record<string, unknown>>>([]);
  const [employeeData, setEmployeeData] = useState<{
    kode_unit: string;
    no_badge: string;
    nama: string;
    pic: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<{
    tanggalPinjam?: string;
    tanggalKembali?: string;
    tanggalPermintaan?: string;
    lokasi?: string;
    unitKerja?: string;
    catatan?: string;
  }>({
    defaultValues: {
      tanggalPinjam: '',
      tanggalKembali: '',
      tanggalPermintaan: '',
      lokasi: '',
      unitKerja: '',
      catatan: '',
    },
  });

  const { data: session } = useSession();

  const { errors } = form.formState;
  const catatan = form.watch('catatan');

  const handleChangeLokasi = (value: string) => {
    const pilih = lokasiOptions.find(x => String(x.id) === String(value));
    const unitName = pilih?.unitkerja?.name ?? '';
    setLokasi(String(value));
    setUnitKerja(unitName);
    form.setValue('lokasi', String(value));
    form.setValue('unitKerja', unitName);
    form.clearErrors(['lokasi', 'unitKerja']);
  };

  const handleSubmit = () => {
    const submit = async () => {
      const ok = await form.trigger();
      if (!ok) return;

      const values = form.getValues();
      setIsSubmitting(true);

      try {
        if (type === 'peminjaman' && employeeData) {
          if (!leaderBadge || !leaderName) {
            toast.error(
              'Data atasan tidak ditemukan. Pastikan data employee valid.'
            );
            return;
          }

          const peminjamanPayload = {
            kode_unit: employeeData.kode_unit,
            no_badge: employeeData.no_badge,
            nama: employeeData.nama,
            pic: employeeData.pic,
            no_badge_approval: leaderBadge,
            nama_approval: leaderName,
            pic_approval: leaderPic || '',
            tgl_peminjaman: tanggalPinjam
              ? `${format(tanggalPinjam, 'yyyy-MM-dd')}T${
                  waktuPinjam || '08:00'
                }:00.000Z`
              : '',
            tgl_pengembalian: tanggalKembali
              ? `${format(tanggalKembali, 'yyyy-MM-dd')}T${
                  waktuKembali || '17:00'
                }:00.000Z`
              : '',
            catatan: values.catatan || '',
            approval: 'Pending',
          };

          await createTransaksiPeminjaman(peminjamanPayload);
          toast.success('Transaksi peminjaman berhasil dibuat!');

          try {
            await sendApproverNotification({
              channels: ['inbox'],
              employeeIds: [String(leaderBadge)],
              type: 'info',
              category: 'general',
              title: `Peminjaman Barang Inventaris dari ${employeeData.nama}`,
              body: `Terdapat permintaan peminjaman Barang Inventaris oleh ${employeeData.nama} (No Badge: ${employeeData.no_badge}). Catatan: ${peminjamanPayload.catatan || '-'}. Silakan cek dan lakukan persetujuan melalui menu BIOS.`,
            });
          } catch (err) {
            console.warn('Failed to send approver notification:', err);
          }

          if (onRefresh) {
            await onRefresh();
          }
        } else if (
          type === 'permintaan' &&
          employeeData &&
          leaderBadge &&
          leaderName
        ) {
          const selectedLokasi = lokasiOptions.find(
            loc => String(loc.id) === String(values.lokasi || lokasi)
          );

          if (
            !selectedLokasi ||
            selectedLokasi.id === undefined ||
            selectedLokasi.id === null
          ) {
            toast.error('Lokasi penempatan belum dipilih');
            return;
          }

          const permintaanPayload = {
            lokasi_id: selectedLokasi.id,
            kode_unit: employeeData.kode_unit,
            no_badge: employeeData.no_badge,
            nama: employeeData.nama,
            pic: employeeData.pic,
            no_badge_approval: leaderBadge,
            nama_approval: leaderName,
            pic_approval: leaderPic || '',
            tgl_permintaan: tanggalPermintaan
              ? format(tanggalPermintaan, 'yyyy-MM-dd')
              : format(new Date(), 'yyyy-MM-dd'),
            catatan: values.catatan || '',
            approval: 'Pending',
          };

          await createTransaksiPermintaan(permintaanPayload);
          toast.success('Transaksi permintaan berhasil dibuat!');

          try {
            await sendApproverNotification({
              channels: ['inbox'],
              employeeIds: [String(leaderBadge)],
              type: 'info',
              category: 'general',
              title: `Permintaan Barang Inventaris dari ${employeeData.nama}`,
              body: `Terdapat permintaan Barang Inventaris oleh ${employeeData.nama} (No Badge: ${employeeData.no_badge}). Lokasi: ${String(selectedLokasi?.lokasi || '-')}. Catatan: ${permintaanPayload.catatan || '-'}. Silakan cek dan lakukan persetujuan melalui menu BIOS.`,
            });
          } catch (err) {
            console.warn('Failed to send approver notification:', err);
          }

          if (onRefresh) {
            await onRefresh();
          }
        } else if (type === 'permintaan' && (!leaderBadge || !leaderName)) {
          toast.error(
            'Data atasan tidak ditemukan. Pastikan data employee valid.'
          );
          return;
        } else if (!employeeData) {
          toast.error(
            'Data employee tidak ditemukan. Pastikan data employee valid.'
          );
          return;
        }

        onSubmit({
          tanggalPinjam:
            values.tanggalPinjam ||
            (tanggalPinjam ? format(tanggalPinjam, 'yyyy-MM-dd') : ''),
          tanggalKembali:
            values.tanggalKembali ||
            (tanggalKembali ? format(tanggalKembali, 'yyyy-MM-dd') : ''),
          tanggalPermintaan:
            values.tanggalPermintaan ||
            (tanggalPermintaan ? format(tanggalPermintaan, 'yyyy-MM-dd') : ''),
          lokasi: values.lokasi || lokasi,
          unitKerja: values.unitKerja || unitKerja,
          catatan: values.catatan || '',
          approver: undefined,
        });

        setOpen(false);
      } catch (error) {
        console.error('Failed to submit:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Terjadi kesalahan';
        const actionText = type === 'peminjaman' ? 'peminjaman' : 'permintaan';
        toast.error(`Gagal membuat transaksi ${actionText}: ${errorMessage}`);
      } finally {
        setIsSubmitting(false);
      }
    };

    submit();
  };

  useEffect(() => {
    if (!open) return;

    const fetchLeader = async () => {
      try {
        const emp = await getEmployeeById(session?.user?.id || '0');
        if (emp) {
          let approver = null;
          if (Array.isArray(emp.leaders) && emp.leaders.length > 0) {            
            approver = emp.organization?.parent?.leader ?? null;
          } else {
            approver = emp.organization?.leader ?? null;
          }

          if (approver) {
            const idVal =
              approver.id ?? approver?.nip ?? approver?.no_badge ?? null;
            setLeaderBadge(idVal ? String(idVal) : null);
            setLeaderName(approver.name ?? null);
            setLeaderPic(approver.pic ?? null);
          }

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

      if (isPermintaan) {
        try {
          const unitResp = await getUnits();
          if (Array.isArray(unitResp?.data))
            setUnits(unitResp.data as Array<Record<string, unknown>>);
        } catch (err) {
          console.warn('Failed to fetch units:', err);
        }

        try {
          const lokasiResp = await getLokasiByUnit('C001370000');
          const lokasiData = lokasiResp?.data;
          if (Array.isArray(lokasiData) && lokasiData.length > 0) {
            const mapped = lokasiData.map((it: LokasiApiItem) => ({
              id: it.id ?? it.qrcode ?? String(it.id_unit ?? ''),
              lokasi: it.lokasi ?? it.area ?? String(it.id ?? ''),
              area: it.area,
              id_unit: it.id_unit,
              unitkerja: it.unitkerja
                ? { name: it.unitkerja.name, leader: it.unitkerja.leader }
                : undefined,
            }));
            setLokasiOptions(mapped);

            const first = mapped[0];

            const leaderFromLokasi = mapped[0]?.unitkerja?.leader;
            if (
              typeof leaderFromLokasi === 'string' ||
              typeof leaderFromLokasi === 'number'
            ) {
              setLeaderBadge(String(leaderFromLokasi));
            }
          }
        } catch (err) {
          console.warn('Failed to fetch lokasi by unit:', err);
        }
      }
    };

    fetchLeader();
  }, [open, isPermintaan]);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl overflow-hidden rounded-md bg-white p-0 shadow-xl sm:max-w-xl dark:bg-neutral-900 dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]">
          <div className="bg-white px-6 pt-4 dark:bg-neutral-900">
            <DialogHeader className="m-0 p-0 pr-2">
              <DialogTitle className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                {isPermintaan
                  ? 'Konfirmasi Permintaan Barang'
                  : 'Konfirmasi Peminjaman Barang Inventaris'}
              </DialogTitle>
              <p className="mt-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                {isPermintaan
                  ? 'Silakan isi detail berikut sebelum mengajukan permintaan barang.'
                  : 'Silakan isi detail berikut sebelum melanjutkan proses peminjaman.'}
              </p>
            </DialogHeader>
          </div>

          <ScrollArea className="max-h-[60vh] overflow-hidden">
            <div className="space-y-4 px-6 text-neutral-900 dark:text-neutral-50">
              <Form {...form}>
                <Alert className="rounded-md border-blue-100 bg-blue-50 p-4 shadow-sm dark:border-blue-900/30 dark:bg-blue-900/10">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div className="ml-3">
                    <AlertTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      {isPermintaan
                        ? 'Informasi permintaan Asset'
                        : 'Informasi Peminjaman Asset'}
                    </AlertTitle>

                    <AlertDescription className="mt-1 text-sm leading-relaxed text-blue-600/90 dark:text-blue-300/80">
                      {isPermintaan
                        ? 'Jika Proses Persetujuan Permintaan Asset Tidak Ada Tindakan dari Atasan '
                        : 'Jika Proses Persetujuan Peminjaman Asset Tidak Ada Tindakan dari Atasan '}
                      Selama 1×24 Jam, Maka Proses Persetujuan Akan Disetujui
                      oleh Sistem!
                    </AlertDescription>
                  </div>
                </Alert>

                {!isPermintaan && (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        <span className="mr-1 text-red-500">*</span>Tanggal
                        Peminjaman
                      </label>

                      <Popover
                        open={tanggalPinjamOpen}
                        onOpenChange={setTanggalPinjamOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'h-10 w-full cursor-pointer justify-start rounded-md border-neutral-200 bg-white text-left font-normal transition-all hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-700',
                              (!tanggalPinjam || !waktuPinjam) &&
                                'text-neutral-500 dark:text-neutral-400'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-neutral-500" />
                            {tanggalPinjam && waktuPinjam
                              ? `${format(
                                  tanggalPinjam,
                                  'dd MMMM yyyy'
                                )} - ${waktuPinjam}`
                              : 'Pilih tanggal dan waktu...'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto rounded-md p-0 shadow-lg"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            captionLayout="dropdown"
                            fromYear={2025}
                            toYear={2030}
                            selected={tanggalPinjam}
                            onSelect={d => {
                              setTanggalPinjam(d);
                              if (d && waktuPinjam) {
                                form.setValue(
                                  'tanggalPinjam',
                                  `${format(
                                    d,
                                    'yyyy-MM-dd'
                                  )}T${waktuPinjam}:00.000Z`
                                );
                                form.clearErrors('tanggalPinjam');
                                setTanggalPinjamOpen(false);
                              } else {
                                form.setValue('tanggalPinjam', '');
                              }
                            }}
                          />
                          <div className="border-t border-neutral-100 p-3 dark:border-neutral-800">
                            <Select
                              value={waktuPinjam}
                              onValueChange={value => {
                                setWaktuPinjam(value);
                                if (tanggalPinjam && value) {
                                  form.setValue(
                                    'tanggalPinjam',
                                    `${format(
                                      tanggalPinjam,
                                      'yyyy-MM-dd'
                                    )}T${value}:00.000Z`
                                  );
                                  form.clearErrors('tanggalPinjam');
                                  setTanggalPinjamOpen(false);
                                } else {
                                  form.setValue('tanggalPinjam', '');
                                }
                              }}
                            >
                              <SelectTrigger className="w-full rounded-md border-neutral-200 dark:border-neutral-700">
                                <SelectValue placeholder="Pilih waktu" />
                              </SelectTrigger>
                              <SelectContent className="rounded-md">
                                {Array.from({ length: 24 }, (_, i) => {
                                  const hour = i.toString().padStart(2, '0');
                                  return [
                                    <SelectItem
                                      key={`${hour}:00`}
                                      value={`${hour}:00`}
                                    >
                                      {`${hour}:00`}
                                    </SelectItem>,
                                    <SelectItem
                                      key={`${hour}:30`}
                                      value={`${hour}:30`}
                                    >
                                      {`${hour}:30`}
                                    </SelectItem>,
                                  ];
                                }).flat()}
                              </SelectContent>
                            </Select>
                          </div>
                        </PopoverContent>
                      </Popover>
                      {errors.tanggalPinjam && (
                        <p className="animate-in fade-in slide-in-from-top-1 mt-1 text-xs text-red-600">
                          {errors.tanggalPinjam?.message ??
                            String(errors.tanggalPinjam)}
                        </p>
                      )}
                      <input
                        type="hidden"
                        {...form.register('tanggalPinjam', {
                          required: 'Tanggal peminjaman wajib diisi.',
                        })}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        <span className="mr-1 text-red-500">*</span>Tanggal
                        Pengembalian
                      </label>

                      <Popover
                        open={tanggalKembaliOpen}
                        onOpenChange={setTanggalKembaliOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            disabled={!tanggalPinjam}
                            className={cn(
                              'h-10 w-full cursor-pointer justify-start rounded-md border-neutral-200 bg-white px-3 text-left font-normal transition-all hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-700',
                              (!tanggalKembali ||
                                !waktuKembali ||
                                !tanggalPinjam) &&
                                'text-neutral-500 dark:text-neutral-400',
                              !tanggalPinjam && 'cursor-not-allowed opacity-50'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-neutral-500" />
                            {tanggalKembali && waktuKembali
                              ? format(tanggalKembali, 'dd MMMM yyyy') +
                                ' - ' +
                                waktuKembali
                              : !tanggalPinjam
                                ? 'Pilih tanggal peminjaman terlebih dahulu'
                                : 'Pilih tanggal...'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto rounded-md p-0 shadow-lg"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            captionLayout="dropdown"
                            fromYear={2025}
                            toYear={2030}
                            selected={tanggalKembali}
                            onSelect={d => {
                              setTanggalKembali(d);
                              if (d && waktuKembali) {
                                form.setValue(
                                  'tanggalKembali',
                                  `${format(
                                    d,
                                    'yyyy-MM-dd'
                                  )}T${waktuKembali}:00.000Z`
                                );
                                form.clearErrors('tanggalKembali');
                                setTanggalKembaliOpen(false);
                              } else {
                                form.setValue('tanggalKembali', '');
                              }
                            }}
                            disabled={date => {
                              if (!tanggalPinjam) return true;
                              return date < tanggalPinjam;
                            }}
                          />
                          <div className="border-t border-neutral-100 p-3 dark:border-neutral-800">
                            <Select
                              value={waktuKembali}
                              onValueChange={value => {
                                setWaktuKembali(value);
                                if (tanggalKembali && value) {
                                  form.setValue(
                                    'tanggalKembali',
                                    `${format(
                                      tanggalKembali,
                                      'yyyy-MM-dd'
                                    )}T${value}:00.000Z`
                                  );
                                  form.clearErrors('tanggalKembali');
                                  setTanggalKembaliOpen(false);
                                } else {
                                  form.setValue('tanggalKembali', '');
                                }
                              }}
                            >
                              <SelectTrigger className="w-full rounded-md border-neutral-200 dark:border-neutral-700">
                                <SelectValue placeholder="Pilih waktu" />
                              </SelectTrigger>
                              <SelectContent className="rounded-md">
                                {Array.from({ length: 24 }, (_, i) => {
                                  const hour = i.toString().padStart(2, '0');
                                  return [
                                    <SelectItem
                                      key={`${hour}:00`}
                                      value={`${hour}:00`}
                                    >
                                      {`${hour}:00`}
                                    </SelectItem>,
                                    <SelectItem
                                      key={`${hour}:30`}
                                      value={`${hour}:30`}
                                    >
                                      {`${hour}:30`}
                                    </SelectItem>,
                                  ];
                                }).flat()}
                              </SelectContent>
                            </Select>
                          </div>
                        </PopoverContent>
                      </Popover>
                      {errors.tanggalKembali && (
                        <p className="animate-in fade-in slide-in-from-top-1 mt-1 text-xs text-red-600">
                          {errors.tanggalKembali?.message ??
                            String(errors.tanggalKembali)}
                        </p>
                      )}
                      <input
                        type="hidden"
                        {...form.register('tanggalKembali', {
                          required: 'Tanggal pengembalian wajib diisi.',
                        })}
                      />
                    </div>
                  </>
                )}

                {isPermintaan && (
                  <>
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
                              'h-10 w-full cursor-pointer justify-start rounded-md border-neutral-200 bg-white px-3 text-left font-normal transition-all hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-700',
                              !tanggalPermintaan &&
                                'text-neutral-500 dark:text-neutral-400'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-neutral-500" />
                            {tanggalPermintaan
                              ? format(tanggalPermintaan, 'PPP')
                              : 'Pilih tanggal...'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto rounded-md p-0 shadow-lg"
                          align="start"
                        >
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
                      {errors.tanggalPermintaan && (
                        <p className="animate-in fade-in slide-in-from-top-1 mt-1 text-xs text-red-600">
                          {errors.tanggalPermintaan?.message ??
                            String(errors.tanggalPermintaan)}
                        </p>
                      )}
                      <input
                        type="hidden"
                        {...form.register('tanggalPermintaan', {
                          required: 'Tanggal permintaan wajib diisi.',
                        })}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        <span className="mr-1 text-red-500">*</span>Lokasi
                        Penempatan
                      </label>

                      <Select
                        value={String(lokasi)}
                        onValueChange={v => {
                          handleChangeLokasi(v);
                        }}
                      >
                        <SelectTrigger className="h-10 w-full cursor-pointer rounded-md border-neutral-200 bg-white px-3 shadow-sm hover:bg-neutral-50 focus:ring-1 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50">
                          <SelectValue placeholder="Pilih lokasi penempatan" />
                        </SelectTrigger>

                        <SelectContent className="rounded-md">
                          {lokasiOptions.map(loc => (
                            <SelectItem key={loc.id} value={String(loc.id)}>
                              {loc.lokasi}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.lokasi && (
                        <p className="animate-in fade-in slide-in-from-top-1 mt-1 text-xs text-red-600">
                          {errors.lokasi?.message ?? String(errors.lokasi)}
                        </p>
                      )}
                      <input
                        type="hidden"
                        {...form.register('lokasi', {
                          required: 'Lokasi penempatan wajib diisi.',
                        })}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        <span className="mr-1 text-red-500">*</span>Unit Kerja
                      </label>
                      <input
                        type="text"
                        value={unitKerja}
                        readOnly
                        className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-500 shadow-sm outline-none dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-400"
                        placeholder="Unit Kerja otomatis terisi"
                      />

                      {errors.unitKerja && (
                        <p className="animate-in fade-in slide-in-from-top-1 mt-1 text-xs text-red-600">
                          {errors.unitKerja?.message ??
                            String(errors.unitKerja)}
                        </p>
                      )}
                      <input
                        type="hidden"
                        {...form.register('unitKerja', {
                          required: 'Unit kerja wajib diisi.',
                        })}
                      />
                    </div>
                  </>
                )}

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
                          className="w-full resize-none rounded-md border-neutral-200 bg-white placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="mb-4">
                  <p className="mb-2 text-sm font-medium">
                    Atasan yang Menyetujui
                  </p>

                  <div className="flex items-center justify-between rounded-md border bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        {leaderPic ? (
                          <AvatarImage
                            src={leaderPic}
                            alt={leaderName ?? 'Atasan'}
                            className="h-full w-full object-cover object-top"
                          />
                        ) : (
                          <AvatarImage
                            src="/images/avatar-pic.jpg"
                            alt={leaderName ?? 'Atasan'}
                            className="h-full w-full object-cover object-top"
                          />
                        )}
                        <AvatarFallback className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {(leaderName || '')
                            .split(' ')
                            .map(n => n[0])
                            .slice(0, 2)
                            .join('')}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                          {leaderName || '-'}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {leaderBadge || '-'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-medium tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                        Proses Maksimal
                      </p>
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        24 Jam
                      </p>
                    </div>
                  </div>
                </div>
              </Form>
            </div>
          </ScrollArea>

          <div className="sticky bottom-0 z-10 flex justify-end bg-white px-3 pt-0 pb-3 dark:border-neutral-800 dark:bg-neutral-900">
            <Button
              className="h-10 cursor-pointer rounded-md bg-[#01793b] px-6 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#016c33] hover:shadow-md active:scale-[0.98] dark:bg-[#01793b] dark:text-white dark:hover:bg-[#043014]"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              <ClipboardCopy className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Menyimpan...' : 'Simpan Permintaan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
