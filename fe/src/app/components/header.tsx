import React from 'react';
import { User, Menu, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useWalletStore } from '@/stores/wallet-store';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { formatCurrency, getAvatarUrl } from '@/lib/utils';
interface HeaderProps {
  onNavigate: (page: string) => void;
  onOpenLogin: () => void;
  currentPage: string;
  isAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, onOpenLogin, currentPage, isAdmin = false }) => {
  const { isAuthenticated, user, logout, isLoading } = useAuthStore();
  const { balance, fetchWallet } = useWalletStore();
  const [showMenu, setShowMenu] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchWallet();
    }
  }, [isAuthenticated, fetchWallet]);

  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const userMenuItems = [
    { id: 'home', label: 'Trang chủ' },
    { id: 'trading', label: 'Giao dịch' },
    { id: 'portfolio', label: 'Danh mục đầu tư' },
    { id: 'wallet', label: 'Nạp / Rút' },
  ];

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    onNavigate('home');
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/10 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => onNavigate('home')}
            >
              <div className="relative">
                <img src="/images/logo2.webp" alt="BSCXAU Logo" className="h-10 w-10 rounded-full object-cover drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/20 to-yellow-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {!isAdmin && (
              <nav className="hidden md:flex items-center gap-1">
                {userMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`px-4 py-2 rounded-xl transition-all duration-300 ${currentPage === item.id
                      ? 'bg-primary/20 text-primary glow-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            )}

            <div className="flex items-center gap-3">
              {!isAdmin && (
                <>
                  {isAuthenticated && user ? (
                    <div className="relative">
                      <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent/50 transition-colors"
                      >
                        <div className="hidden sm:block text-right">
                          <div className="text-sm font-semibold">
                            {user.nickname || user.email.split('@')[0]}
                          </div>
                          <div className="text-xs text-primary">
                            {formatCurrency(balance)}
                          </div>
                        </div>
                        <Avatar className="h-10 w-10 border-2 border-primary/20">
                          <AvatarImage src={getAvatarUrl(user.avatarUrl)} alt={user.nickname} className="object-cover" />
                          <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-600 text-black font-bold">
                            {(user.nickname || user.email)[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                      </button>

                      {/* User Dropdown Menu */}
                      {showUserMenu && (
                        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-card border shadow-xl animate-in slide-in-from-top-2 z-50">
                          <div className="p-3 border-b border-border">
                            <div className="font-semibold">{user.nickname || user.email.split('@')[0]}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                          <div className="p-2">
                            <button
                              onClick={() => { onNavigate('messages'); setShowUserMenu(false); }}
                              className="w-full px-3 py-2 text-left rounded-lg hover:bg-white/5 transition-colors text-sm flex items-center gap-2"
                            >
                              Tin nhắn hỗ trợ
                            </button>
                            <button
                              onClick={() => { onNavigate('profile'); setShowUserMenu(false); }}
                              className="w-full px-3 py-2 text-left rounded-lg hover:bg-white/5 transition-colors text-sm"
                            >
                              Hồ sơ cá nhân
                            </button>
                          </div>
                          <div className="p-2 border-t border-border">
                            <button
                              onClick={handleLogout}
                              className="w-full px-3 py-2 text-left rounded-lg hover:bg-destructive/10 transition-colors text-sm text-destructive flex items-center gap-2"
                            >
                              <LogOut className="h-4 w-4" />
                              Đăng xuất
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={onOpenLogin}
                      disabled={isLoading}
                      className="gap-2 glow-primary"
                    >
                      <User className="h-4 w-4" />
                      {isLoading ? 'Đang tải...' : 'Đăng nhập'}
                    </Button>
                  )}

                  <button
                    className="md:hidden p-2 hover:bg-accent rounded-xl transition-colors"
                    onClick={() => setShowMenu(!showMenu)}
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {!isAdmin && showMenu && (
            <div className="md:hidden py-4 border-t border-border animate-in slide-in-from-top-2">
              <nav className="flex flex-col gap-1">
                {userMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setShowMenu(false);
                    }}
                    className={`px-4 py-3 rounded-xl text-left transition-all ${currentPage === item.id
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  );
};
