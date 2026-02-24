'use client';

import * as React from 'react';
import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  BaggageClaim,
  BriefcaseBusiness,
  ChevronDown,
  Command,
  FilePlus,
  FolderOpen,
  HandCoins,
  Handshake,
  PackagePlus,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingBag,
} from 'lucide-react';
import { useSession } from 'next-auth/react';

import { NavUser } from '@/components/nav-user';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: 'Barang Inventaris',
      icon: BaggageClaim,
      items: [
        {
          title: 'Peminjaman',
          href: '/user/barang-inventaris/peminjaman',
        },
        {
          title: 'Permintaan',
          href: '/user/barang-inventaris/permintaan',
        },
      ],
    },
    {
      title: 'Office Supplies',
      icon: ShoppingBag,
      items: [
        {
          title: 'Permintaan Consumable',
          href: '/user/office-supplies/permintaan',
        },
      ],
    },
    {
      title: 'Transaksi Saya',
      icon: BriefcaseBusiness,
      items: [
        {
          title: 'Barang Inventaris',
          href: '/user/transaksi-saya/laporan-barang-inventaris',
        },
        {
          title: 'Office Supplies',
          href: '/user/transaksi-saya/laporan-office-supplies',
        },
      ],
    },
  ],
  mails: [
    {
      name: 'William Smith',
      email: 'williamsmith@example.com',
      subject: 'Meeting Tomorrow',
      date: '09:34 AM',
      teaser:
        'Hi team, just a reminder about our meeting tomorrow at 10 AM.\nPlease come prepared with your project updates.',
    },
    {
      name: 'Alice Smith',
      email: 'alicesmith@example.com',
      subject: 'Re: Project Update',
      date: 'Yesterday',
      teaser:
        "Thanks for the update. The progress looks great so far.\nLet's schedule a call to discuss the next steps.",
    },
    {
      name: 'Bob Johnson',
      email: 'bobjohnson@example.com',
      subject: 'Weekend Plans',
      date: '2 days ago',
      teaser:
        "Hey everyone! I'm thinking of organizing a team outing this weekend.\nWould you be interested in a hiking trip or a beach day?",
    },
    {
      name: 'Emily Davis',
      email: 'emilydavis@example.com',
      subject: 'Re: Question about Budget',
      date: '2 days ago',
      teaser:
        "I've reviewed the budget numbers you sent over.\nCan we set up a quick call to discuss some potential adjustments?",
    },
    {
      name: 'Michael Wilson',
      email: 'michaelwilson@example.com',
      subject: 'Important Announcement',
      date: '1 week ago',
      teaser:
        "Please join us for an all-hands meeting this Friday at 3 PM.\nWe have some exciting news to share about the company's future.",
    },
    {
      name: 'Sarah Brown',
      email: 'sarahbrown@example.com',
      subject: 'Re: Feedback on Proposal',
      date: '1 week ago',
      teaser:
        "Thank you for sending over the proposal. I've reviewed it and have some thoughts.\nCould we schedule a meeting to discuss my feedback in detail?",
    },
    {
      name: 'David Lee',
      email: 'davidlee@example.com',
      subject: 'New Project Idea',
      date: '1 week ago',
      teaser:
        "I've been brainstorming and came up with an interesting project concept.\nDo you have time this week to discuss its potential impact and feasibility?",
    },
    {
      name: 'Olivia Wilson',
      email: 'oliviawilson@example.com',
      subject: 'Vacation Plans',
      date: '1 week ago',
      teaser:
        "Just a heads up that I'll be taking a two-week vacation next month.\nI'll make sure all my projects are up to date before I leave.",
    },
    {
      name: 'James Martin',
      email: 'jamesmartin@example.com',
      subject: 'Re: Conference Registration',
      date: '1 week ago',
      teaser:
        "I've completed the registration for the upcoming tech conference.\nLet me know if you need any additional information from my end.",
    },
    {
      name: 'Sophia White',
      email: 'sophiawhite@example.com',
      subject: 'Team Dinner',
      date: '1 week ago',
      teaser:
        "To celebrate our recent project success, I'd like to organize a team dinner.\nAre you available next Friday evening? Please let me know your preferences.",
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Note: I'm using state to show active item.
  // IRL you should use the url/router.
  const [activeItem, setActiveItem] = React.useState(data.navMain[0]);
  const [mails, setMails] = React.useState(data.mails);
  const { setOpen } = useSidebar();

  return (
    <Sidebar
      collapsible="icon"
      collapsedIconSections={2}
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <a href="#">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Acme Inc</span>
                    <span className="truncate text-xs">Enterprise</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {data.navMain.map(item => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => {
                        setActiveItem(item);
                        const mail = data.mails.sort(() => Math.random() - 0.5);
                        setMails(
                          mail.slice(
                            0,
                            Math.max(5, Math.floor(Math.random() * 10) + 1)
                          )
                        );
                        setOpen(true);
                      }}
                      isActive={activeItem?.title === item.title}
                      className="px-2.5 md:px-2"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar - Custom BIOS Sidebar */}
      <CustomBIOSSidebar />
    </Sidebar>
  );
}

// Types for the custom sidebar components
interface SidebarItemProps {
  href: string;
  label: string;
  icon?: React.ReactNode;
  collapsed: boolean;
}

interface SidebarGroupProps {
  title: string;
  icon: React.ReactNode;
  collapsed: boolean;
  children: React.ReactNode;
}

// Custom BIOS Sidebar Component
export function CustomBIOSSidebar() {
  const { data: session } = useSession();
  const roles: string[] = session?.user?.roles ?? [];
  const isApprover = roles.includes('approval');
  const { open, setOpen, isMobile } = useSidebar();

  function toggle() {
    setOpen(!open);
  }

  const isCollapsed = !open && !isMobile;

  return (
    <div className={cn('relative h-full', isMobile && 'flex-1')}>
      <aside
        className={cn(
          '-ml-px flex h-full min-w-0 flex-none flex-col border-l-0 bg-white transition-all duration-300 md:flex dark:border-neutral-800 dark:bg-neutral-900',
          isMobile
            ? 'w-full border-none shadow-none'
            : isCollapsed
              ? 'w-20 shadow-sm'
              : 'w-76 shadow-sm',
          !isMobile &&
            'hidden group-data-[collapsible=icon]:!w-[var(--sidebar-width-icon)] md:flex'
        )}
      >
        <div
          className={cn(
            'flex items-center gap-3 px-4 py-4 transition-all',
            isCollapsed ? 'justify-center' : ''
          )}
        >
          <div className="rounded-md bg-neutral-50 p-1 dark:bg-neutral-800">
            <FolderOpen className="text-neutral-800 dark:text-neutral-200" />
          </div>

          {!isCollapsed && (
            <h1 className="text-base font-semibold whitespace-nowrap text-neutral-900 dark:text-neutral-100">
              BIOS
            </h1>
          )}
        </div>

        <nav
          className={cn(
            'flex-1 space-y-1 px-3 text-sm transition-all',
            isCollapsed ? 'mt-1' : ''
          )}
        >
          {!isCollapsed && (
            <p className="mb-2 text-xs tracking-wider text-neutral-500 uppercase">
              Transaksi
            </p>
          )}

          <CustomSidebarGroup
            title="Barang Inventaris"
            collapsed={isCollapsed}
            icon={
              <BaggageClaim
                style={{ width: '20px', height: '20px', flexShrink: 0 }}
              />
            }
          >
            <CustomSidebarItem
              collapsed={isCollapsed}
              href="/user/barang-inventaris/peminjaman"
              label="Peminjaman"
            />

            <CustomSidebarItem
              collapsed={isCollapsed}
              href="/user/barang-inventaris/permintaan"
              label="Permintaan"
            />
          </CustomSidebarGroup>

          <CustomSidebarGroup
            title="Office Supplies"
            collapsed={isCollapsed}
            icon={
              <ShoppingBag
                style={{ width: '23px', height: '23px', flexShrink: 0 }}
              />
            }
          >
            <CustomSidebarItem
              collapsed={isCollapsed}
              href="/user/office-supplies/permintaan"
              label="Permintaan Consumable"
            />
          </CustomSidebarGroup>

          {!isCollapsed && (
            <p className="mt-4 mb-2 text-xs tracking-wider text-neutral-500 uppercase">
              LAPORAN
            </p>
          )}

          {isApprover && (
            <CustomSidebarGroup
              title="Approver"
              collapsed={isCollapsed}
              icon={
                <Handshake
                  style={{ width: '20px', height: '20px', flexShrink: 0 }}
                />
              }
            >
              <CustomSidebarItem
                collapsed={isCollapsed}
                href="/approver/peminjaman"
                label="Peminjaman"
                icon={
                  <HandCoins
                    style={{ width: '20px', height: '20px', flexShrink: 0 }}
                  />
                }
              />

              <CustomSidebarItem
                collapsed={isCollapsed}
                href="/approver/permintaan"
                label="Permintaan"
                icon={
                  <FilePlus
                    style={{ width: '20px', height: '20px', flexShrink: 0 }}
                  />
                }
              />

              <CustomSidebarItem
                collapsed={isCollapsed}
                href="/approver/office-supplies"
                label="Permintaan Office Supplies"
                icon={
                  <PackagePlus
                    style={{ width: '20px', height: '20px', flexShrink: 0 }}
                  />
                }
              />
            </CustomSidebarGroup>
          )}

          <CustomSidebarGroup
            title="Transaksi Saya"
            collapsed={isCollapsed}
            icon={
              <BriefcaseBusiness
                style={{ width: '23px', height: '23px', flexShrink: 0 }}
              />
            }
          >
            <CustomSidebarItem
              collapsed={isCollapsed}
              href="/user/transaksi-saya/laporan-barang-inventaris"
              label="Barang Inventaris"
            />

            <CustomSidebarItem
              collapsed={isCollapsed}
              href="/user/transaksi-saya/laporan-office-supplies"
              label="Office Supplies"
            />
          </CustomSidebarGroup>
        </nav>
      </aside>
    </div>
  );
}

function CustomSidebarItem({ href, label, icon, collapsed }: SidebarItemProps) {
  const pathname = usePathname();
  const active = pathname && (pathname === href || pathname.startsWith(href));

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
        active
          ? 'bg-sidebar-primary dark:bg-sidebar-primary font-semibold text-white'
          : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground',
        collapsed && 'justify-center px-2'
      )}
    >
      {icon && (
        <div className="flex h-5 w-5 items-center justify-center">{icon}</div>
      )}
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

function CustomSidebarGroup({
  title,
  icon,
  collapsed,
  children,
}: SidebarGroupProps) {
  const [open, setOpen] = useState(true);

  if (collapsed) {
    return (
      <div className="flex items-center justify-center py-2">
        <div className="text-sidebar-foreground rounded-md px-3 py-2">
          {icon}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <button
        className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-[40px] w-full cursor-pointer items-center justify-between rounded-md px-3 py-2"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="text-sidebar-foreground">{icon}</div>
          <span className="text-sm font-medium">{title}</span>
        </div>

        <ChevronDown
          className={cn(
            'text-muted-foreground h-4 w-4 transition-transform',
            open ? 'rotate-180' : ''
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            'overflow-hidden transition-all',
            'mt-1 ml-[20px] space-y-1 pl-3'
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
