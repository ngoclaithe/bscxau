import React, { useEffect } from 'react';
import { LayoutDashboard, Settings, TrendingUp, Users, Shield, LogOut, Activity, FileText, Sliders, DollarSign, CreditCard, MessageSquare } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useAdminStore, verifyAdminSession } from '@/stores/admin-store';
import { useSupportStore } from '@/stores/support-store';


interface AdminLayoutProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentPage, onNavigate, children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const { logout, userRole, isAuthenticated } = useAdminStore();
  const { pendingSessions, fetchPendingSessions } = useSupportStore();
  const pendingCount = pendingSessions.length;

  // Verify admin session when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      verifyAdminSession();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchPendingSessions();
    const interval = setInterval(fetchPendingSessions, 30000);
    return () => clearInterval(interval);
  }, [fetchPendingSessions]);


  const menuItems = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard, allowedRoles: ['ADMIN', 'TRADE_AUDITOR', 'FINANCE_AUDITOR'] },
    { id: 'admin-chat', label: 'Hỗ trợ Chat', icon: MessageSquare, allowedRoles: ['ADMIN', 'TRADE_AUDITOR', 'FINANCE_AUDITOR'], badge: pendingCount },

    { id: 'admin-trades', label: 'Giám sát lệnh', icon: Activity, allowedRoles: ['ADMIN', 'TRADE_AUDITOR'] },
    { id: 'admin-traders', label: 'Quản lý Traders', icon: Users, allowedRoles: ['ADMIN', 'TRADE_AUDITOR'] },
    { id: 'admin-banks', label: 'Quản lý Ngân hàng', icon: CreditCard, allowedRoles: ['ADMIN', 'FINANCE_AUDITOR'] },
    { id: 'admin-pairs', label: 'Cấu hình Pairs', icon: Sliders, allowedRoles: ['ADMIN'] },
    { id: 'admin-prices', label: 'Điều chỉnh Giá', icon: DollarSign, allowedRoles: ['ADMIN'] },
    { id: 'admin-transactions', label: 'Quản lý Nạp/Rút', icon: Activity, allowedRoles: ['ADMIN', 'FINANCE_AUDITOR'] },
    { id: 'admin-analytics', label: 'Analytics', icon: TrendingUp, allowedRoles: ['ADMIN', 'TRADE_AUDITOR'], hidden: true },
    { id: 'admin-security', label: 'Bảo mật & Kiểm soát', icon: Shield, allowedRoles: ['ADMIN'] },
    // { id: 'admin-settings', label: 'Cài đặt hệ thống', icon: Settings, allowedRoles: ['ADMIN'] },
    // { id: 'admin-logs', label: 'Logs & Audit', icon: FileText, allowedRoles: ['ADMIN'] },
  ];

  // Filter menu items based on user role and hidden flag
  const filteredMenuItems = menuItems.filter(item =>
    !item.hidden && item.allowedRoles.includes(userRole?.toUpperCase() || 'USER')
  );

  const handleLogout = () => {
    logout();
    onNavigate('home');
  };

  return (
    <div className="flex h-screen bg-background dark">
      <aside className={`border-r border-border bg-card/50 backdrop-blur-xl flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-20'}`}>
        <div className={`p-4 border-b border-border flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} overflow-hidden h-20`}>
          {isSidebarOpen ? (
            <div className="flex items-center gap-3">
              <img src="/images/logo2.webp" alt="BSCXAU Logo" className="h-10 w-10 rounded-full object-cover drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">BSCXAU</span>
                <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                  Role: <span className="font-semibold text-primary capitalize">{userRole}</span>
                </div>
              </div>
            </div>
          ) : (
            <img src="/images/logo2.webp" alt="Logo" className="h-10 w-10 rounded-full object-cover shrink-0" />
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={!isSidebarOpen ? item.label : undefined}
                className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-4' : 'justify-center px-0'} py-3 rounded-xl transition-all duration-300 ${isActive
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-600 text-black shadow-lg shadow-amber-500/30 font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {isSidebarOpen && <span className="font-medium flex-1 text-left truncate">{item.label}</span>}
                {item.badge != null && item.badge > 0 && isSidebarOpen && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0 ${isActive ? 'bg-black/30 text-black' : 'bg-red-500 text-white'}`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
                {item.badge != null && item.badge > 0 && !isSidebarOpen && (
                  <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-red-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border flex flex-col gap-2">
          <Button
            variant="ghost"
            className={`w-full ${isSidebarOpen ? 'justify-start px-4' : 'justify-center px-0'} text-muted-foreground hover:text-white mb-2`}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <span className="leading-none text-xl">{isSidebarOpen ? '«' : '»'}</span>
            {isSidebarOpen && <span className="ml-2 font-medium">Thu gọn menu</span>}
          </Button>

          <Button
            variant="outline"
            className={`w-full ${isSidebarOpen ? 'px-4' : 'px-0 justify-center'} transition-all`}
            onClick={handleLogout}
            title={!isSidebarOpen ? "Logout" : undefined}
          >
            <LogOut className="h-4 w-4" />
            {isSidebarOpen && <span className="ml-2">Đăng xuất</span>}
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-yellow-600/5 pointer-events-none" />
        <div className="container mx-auto p-8 relative">
          {children}
        </div>
      </main>
    </div>
  );
};
