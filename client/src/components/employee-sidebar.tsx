import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Settings, LogOut, User, BarChart3, Warehouse, Wallet, ChefHat, Coffee, Languages, Clock, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Employee } from '@shared/schema';
import tasaliLogoStaff from "@assets/logo.png";
import { brand } from "@/lib/brand";

interface EmployeeSidebarProps {
  employee: Employee | null;
  onLogout: () => void;
}

type PageId = string;

const PAGE_ID_TO_PATH: Record<PageId, { path: string; label: string; labelEn: string; icon: any; section: 'base' | 'manager'; isNotifications?: boolean }> = {
  pos: { path: '/employee/pos', label: 'نقاط البيع', labelEn: 'POS', icon: BarChart3, section: 'base' },
  orders: { path: '/employee/orders', label: 'الطلبات', labelEn: 'Orders', icon: ClipboardList, section: 'base' },
  kitchen: { path: '/employee/kitchen', label: 'المطبخ', labelEn: 'Kitchen', icon: ChefHat, section: 'base' },
  shifts: { path: '/employee/shifts', label: 'الورديات', labelEn: 'Shifts', icon: Clock, section: 'base' },
  attendance: { path: '/employee/attendance', label: 'الحضور والانصراف', labelEn: 'Attendance', icon: User, section: 'base' },
  menu_management: { path: '/employee/menu-management', label: 'إدارة القائمة', labelEn: 'Menu', icon: Coffee, section: 'manager' },
  inventory: { path: '/manager/inventory', label: 'المخزون', labelEn: 'Inventory', icon: Warehouse, section: 'manager' },
  accounting: { path: '/manager/accounting', label: 'المحاسبة', labelEn: 'Accounting', icon: Wallet, section: 'manager' },
  reports: { path: '/admin/reports', label: 'التقارير', labelEn: 'Reports', icon: BarChart3, section: 'manager' },
  unified_reports: { path: '/manager/unified-reports', label: 'التقارير الموحدة', labelEn: 'Unified Reports', icon: Building2, section: 'manager' },
  employees: { path: '/admin/employees', label: 'إدارة الموظفين', labelEn: 'Employees', icon: User, section: 'manager' },
  settings: { path: '/admin/settings', label: 'الإعدادات', labelEn: 'Settings', icon: Settings, section: 'manager' },
};

const ADMIN_ROLES = ['manager', 'owner', 'admin', 'branch_manager'];

function getAccessiblePages(employee: Employee | null): PageId[] {
  if (!employee) return ['dashboard'];
  const role = employee.role || 'cashier';

  if (['owner', 'admin'].includes(role)) {
    return Object.keys(PAGE_ID_TO_PATH);
  }

  const allowedPages = (employee as any).allowedPages;
  if (allowedPages && Array.isArray(allowedPages) && allowedPages.length > 0) {
    // Always include notifications
    return allowedPages.includes('notifications') ? allowedPages : [...allowedPages, 'notifications'];
  }

  const roleDefaults: Record<string, PageId[]> = {
    cashier: ['pos', 'orders', 'shifts', 'attendance'],
    chef: ['orders', 'kitchen', 'shifts', 'attendance'],
    cook: ['orders', 'kitchen', 'shifts', 'attendance'],
    waiter: ['pos', 'orders', 'shifts', 'attendance'],
    supervisor: ['pos', 'orders', 'kitchen', 'shifts', 'attendance', 'menu_management', 'reports'],
    manager: ['pos', 'orders', 'kitchen', 'shifts', 'attendance', 'menu_management', 'inventory', 'accounting', 'reports', 'unified_reports', 'employees', 'settings'],
    branch_manager: ['pos', 'orders', 'kitchen', 'shifts', 'attendance', 'menu_management', 'inventory', 'accounting', 'reports', 'unified_reports', 'employees', 'settings'],
  };

  return roleDefaults[role] || ['pos', 'orders', 'shifts', 'attendance'];
}

function NotifBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function EmployeeSidebar({ employee, onLogout }: EmployeeSidebarProps) {
  const [location, navigate] = useLocation();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  // Fetch unread notification count — poll every 30s
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread-count'],
    refetchInterval: 30_000,
    retry: false,
    enabled: !!employee,
  });
  const unreadCount = unreadData?.count ?? 0;

  const accessiblePages = getAccessiblePages(employee);
  const isAr = i18n.language === 'ar';
  
  const baseItems = accessiblePages
    .filter(pageId => PAGE_ID_TO_PATH[pageId]?.section === 'base')
    .map(pageId => {
      const config = PAGE_ID_TO_PATH[pageId];
      return { label: isAr ? config.label : config.labelEn, icon: config.icon, path: config.path, isNotifications: config.isNotifications };
    });

  const managerItems = accessiblePages
    .filter(pageId => PAGE_ID_TO_PATH[pageId]?.section === 'manager')
    .map(pageId => {
      const config = PAGE_ID_TO_PATH[pageId];
      return { label: isAr ? config.label : config.labelEn, icon: config.icon, path: config.path, isNotifications: config.isNotifications };
    });

  const showManagerSection = managerItems.length > 0;

  return (
    <div className="hidden lg:flex w-64 bg-background border-l border-border flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-2">
          <img 
            src={tasaliLogoStaff} 
            alt={brand.platformNameEn}
            className="w-10 h-10 object-contain rounded-lg"
          />
          <div>
            <h2 className="text-lg font-bold text-foreground">{brand.platformNameAr}</h2>
            <p className="text-xs text-muted-foreground">{t('sidebar.employee_system')}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{t('sidebar.employee_label', { name: employee?.fullName || t('sidebar.loading') })}</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {baseItems.map((item) => {
          const Icon = item.icon;
          const fullPath = location + window.location.search;
          const isActive = item.path.includes('?')
            ? fullPath === item.path
            : location === item.path && !window.location.search;
          const showBadge = item.isNotifications && unreadCount > 0;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-foreground hover:bg-primary/10'
              }`}
              data-testid={`sidebar-link-${item.path.split('/').pop()}`}
            >
              <div className="relative shrink-0">
                <Icon className="w-5 h-5" />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none ring-1 ring-background">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="font-medium flex-1 text-right">{item.label}</span>
              {showBadge && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          );
        })}

        {showManagerSection && (
          <>
            <div className="my-4 border-t border-border pt-4">
              <p className="px-4 text-xs font-bold text-[#2D9B6E] uppercase">{t('sidebar.admin_menu')}</p>
            </div>
            {managerItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground hover:bg-primary/10'
                  }`}
                  data-testid={`sidebar-link-${item.path.split('/').pop()}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <Button
          onClick={toggleLanguage}
          variant="outline"
          className="w-full justify-start text-sm border-border text-muted-foreground hover:bg-primary/10"
          data-testid="button-toggle-language"
        >
          <Languages className="w-4 h-4 ml-2" />
          {i18n.language === 'ar' ? 'English' : 'عربي'}
        </Button>
        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full justify-start text-sm border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          data-testid="button-logout-sidebar"
        >
          <LogOut className="w-4 h-4 ml-2" />
          {t('sidebar.logout')}
        </Button>
      </div>
    </div>
  );
}
