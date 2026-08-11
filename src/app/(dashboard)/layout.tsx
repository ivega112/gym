"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LayoutDashboard, Users, PlusCircle, Clock, Archive, Settings, LogOut, DatabaseBackup, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BackupEnforcer } from "@/components/BackupEnforcer";

const navigation = [
  { name: "الرئيسية", href: "/dashboard", icon: LayoutDashboard },
  { name: "إضافة اشتراك", href: "/add", icon: PlusCircle },
  { name: "الاشتراكات الفعالة", href: "/subscriptions", icon: Users },
  { name: "تشارف على الانتهاء", href: "/expiring", icon: Clock },
  { name: "منتهية", href: "/expired", icon: Archive },
  { name: "النسخ الاحتياطي", href: "/backup", icon: DatabaseBackup },
  { name: "سجل العمليات", href: "/logs", icon: ShieldAlert },
  { name: "المستخدمين", href: "/users", icon: Users },
  { name: "الإعدادات", href: "/settings", icon: Settings },
];

const SidebarContent = ({ pathname, handleLogout }: { pathname: string, handleLogout: () => void }) => (
  <div className="flex h-full flex-col bg-white border-l">
    <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b">
      <span className="text-xl font-bold font-cairo">إدارة النادي</span>
    </div>
    <div className="flex flex-1 flex-col overflow-y-auto">
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon
                className={`ml-3 h-5 w-5 flex-shrink-0 ${
                  isActive ? "text-gray-900" : "text-gray-400 group-hover:text-gray-500"
                }`}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
    <div className="border-t p-4">
      <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
        <LogOut className="ml-3 h-5 w-5" />
        تسجيل الخروج
      </Button>
    </div>
  </div>
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    router.push("/login");
  };



  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-cairo">
      <BackupEnforcer />
      {/* Top Navbar for Mobile */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 lg:hidden">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger className="-m-2.5 p-2.5 text-gray-700 lg:hidden inline-flex items-center justify-center rounded-md hover:bg-gray-100 h-10 w-10">
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-72">
            <SidebarContent pathname={pathname} handleLogout={handleLogout} />
          </SheetContent>
        </Sheet>
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end items-center">
          <span className="text-lg font-bold">إدارة النادي</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Static Sidebar for Desktop (Right aligned via dir="rtl") */}
        <div className="hidden lg:flex lg:w-72 lg:flex-col lg:inset-y-0 z-50">
          <SidebarContent pathname={pathname} handleLogout={handleLogout} />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          <div className="px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
