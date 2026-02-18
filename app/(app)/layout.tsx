import { AppBreadcrumb } from '@/components/app-breadcrumb';
import { AppSidebar } from '@/components/app-sidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

export const metadata = {
  title: 'Demplon',
  description: 'Aplikasi Demplon',
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TooltipProvider>
      <SidebarProvider
        style={
          {
            '--sidebar-width': '350px',
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        <SidebarInset>
          <header className="border-border flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="h-8 w-8 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800" />
            <div className="flex-1">
              <AppBreadcrumb />
            </div>
          </header>
          <div className="flex-1 p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
