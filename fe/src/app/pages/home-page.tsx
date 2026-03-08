import React from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { AuthDrawer } from '@/app/components/auth-drawer';
import { StatsTicker } from '@/app/components/stats-ticker';
import { TrendingUp, Activity, Shield, ArrowRight, BarChart3, Clock, DollarSign, Globe, Lock, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { isAuthenticated } = useAuthStore();
  const [showAuthDrawer, setShowAuthDrawer] = React.useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans">
      <StatsTicker />

      {/* ─── Hero Section ─── */}
      <section className="relative min-h-screen flex items-center pt-24 pb-20 overflow-hidden">
        {/* Premium Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-amber-500/20 via-yellow-600/5 to-transparent rounded-full blur-[120px] opacity-70" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-amber-700/10 rounded-full blur-[150px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        </div>

        <div className="container mx-auto px-4 z-10 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

            {/* Left Column: Text & CTA */}
            <div className="flex flex-col items-start text-left max-w-2xl">
              <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-full border border-amber-500/20 bg-amber-500/5 backdrop-blur-md mb-8 hover:bg-amber-500/10 transition-colors">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <span className="text-sm font-semibold tracking-wide text-amber-300">
                  BSCXAU V2.0 ĐÃ RA MẮT
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-[5.5rem] font-black mb-6 leading-[1.05] tracking-tight flex flex-col">
                <span className="text-white drop-shadow-sm">Thống lĩnh</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 drop-shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                  Thị trường Vàng
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-zinc-400 mb-10 leading-relaxed max-w-xl border-l-2 border-amber-500/30 pl-5">
                Nền tảng giao dịch <strong className="text-amber-400 font-semibold">Tài sản Kỹ thuật số & Cổ điển</strong> tiên tiến nhất. Tốc độ khớp lệnh O(1), bảo mật đa tầng, biểu đồ Real-time dành riêng cho Trader chuyên nghiệp.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                {!isAuthenticated ? (
                  <Button
                    size="lg"
                    onClick={() => setShowAuthDrawer(true)}
                    className="group relative overflow-hidden rounded-xl px-8 py-7 text-lg font-bold text-black bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)] hover:shadow-[0_0_60px_-15px_rgba(245,158,11,0.7)] transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                    <span className="relative flex items-center justify-center gap-2">
                      Mở tài khoản ngay <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={() => onNavigate('trading')}
                    className="group relative overflow-hidden rounded-xl px-8 py-7 text-lg font-bold text-black bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)] transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                    <span className="relative flex items-center justify-center gap-2">
                      Vào Terminal <Activity className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => onNavigate('trading')}
                  className="rounded-xl px-8 py-7 text-lg border-zinc-700/80 text-zinc-300 bg-white/5 backdrop-blur-sm hover:text-amber-400 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all duration-300"
                >
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Xem báo giá Live
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="mt-12 flex items-center gap-8">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`w-10 h-10 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center relative z-[${10 - i}]`}>
                      <img src={`https://i.pravatar.cc/100?img=${i + 10}`} className="w-full h-full rounded-full object-cover opacity-80" alt="Trader" />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(i => <TrendingUp key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />)}
                  </div>
                  <div className="text-sm text-zinc-400"><strong className="text-white">100,000+</strong> Traders đã tham gia</div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visuals */}
            <div className="relative w-full h-[500px] lg:h-[700px] hidden md:block">
              {/* 3D Perspective Device/Platform Showcase */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] max-w-[800px] [transform:perspective(1500px)_rotateY(-15deg)_rotateX(5deg)] group">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[20px_20px_80px_-20px_rgba(245,158,11,0.2)] bg-black/40 backdrop-blur-xl animate-float">

                  {/* Top Window Bar */}
                  <div className="h-8 bg-zinc-900/80 border-b border-white/5 flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <div className="mx-auto text-[10px] text-zinc-500 uppercase tracking-widest font-medium">BSCXAU.io / Terminal</div>
                  </div>

                  {/* Image Content */}
                  <img
                    src="/images/hero.webp"
                    alt="BSCXAU Trading Dashboard"
                    className="w-full h-auto object-cover opacity-90 transition-opacity duration-700 group-hover:opacity-100"
                  />

                  {/* Inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Floating Glass Widget 1 - Left */}
                <div className="absolute -left-12 bottom-1/4 z-20 bg-zinc-900/80 border border-amber-500/30 p-5 rounded-2xl shadow-2xl backdrop-blur-xl animate-float" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-xl font-black text-white">2,745.<span className="text-amber-500">80</span></div>
                      <div className="text-xs text-emerald-400 font-bold mt-1 inline-flex items-center gap-1">
                        +1.2% <TrendingUp className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Glass Widget 2 - Right */}
                <div className="absolute -right-8 top-1/4 z-20 bg-zinc-900/80 border border-emerald-500/30 p-5 rounded-2xl shadow-2xl backdrop-blur-xl animate-float" style={{ animationDelay: '2.5s' }}>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-400 mb-1">Thanh khoản Pool</div>
                      <div className="text-xl font-black text-white">45,200,000 VND</div>
                      <div className="text-xs text-zinc-500 font-medium mt-1">
                        Decentralized Oracle
                      </div>
                    </div>
                  </div>
                </div>

                {/* Glowing Orb behind everything */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[80%] bg-amber-500/20 blur-[120px] -z-10 rounded-full" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Stats Banner ─── */}
      <section className="border-y border-border/5 bg-card/20">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5">
            {[
              { val: "O(1)", label: "Khớp lệnh độ trễ 0", icon: Zap },
              { val: "65,000 Tỷ+", label: "Khối lượng giao dịch", icon: BarChart3 },
              { val: "100%", label: "Dữ liệu On-chain", icon: Globe },
              { val: "24/7", label: "Giao dịch liên tục", icon: Clock },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="flex flex-col items-center justify-center text-center px-4">
                  <Icon className="h-8 w-8 text-amber-500 mb-4 opacity-80" />
                  <div className="text-4xl lg:text-5xl font-black text-white mb-2 tracking-tighter">{stat.val}</div>
                  <div className="text-zinc-500 text-sm uppercase tracking-widest font-semibold">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── Feature Section 1 (Left Image, Right Text) ─── */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">

            <div className="w-full lg:w-1/2 relative group">
              <div className="absolute inset-0 bg-blue-500/20 blur-[120px] rounded-full z-0 transition duration-700 group-hover:bg-amber-500/20" />
              <div className="relative z-10 border border-white/10 rounded-3xl p-1 bg-gradient-to-br from-white/10 to-transparent">
                <img
                  src="/images/section1.webp"
                  alt="Phân tích kỹ thuật chuyên sâu"
                  className="rounded-2xl shadow-2xl object-cover w-full opacity-90 transition duration-500 group-hover:opacity-100 group-hover:scale-[1.01]"
                />
              </div>
            </div>

            <div className="w-full lg:w-1/2 space-y-8">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl shadow-amber-500/20 mb-2">
                <BarChart3 className="h-8 w-8 text-black" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                Phân tích kỹ thuật <br />
                <span className="text-zinc-400">Không độ trễ. Đa khung giờ.</span>
              </h2>
              <p className="text-xl text-zinc-500 leading-relaxed">
                Biểu đồ Candlestick chuẩn xác đến từng mili-giây, kết hợp hệ thống báo giá Real-time từ các nhà cung cấp thanh khoản hàng đầu. Tối đa hóa lợi thế khi giao dịch các khung thời gian ngắn 1 phút đến 15 phút.
              </p>

              <ul className="space-y-5 pt-4">
                {['Đa dạng chỉ báo cơ bản & nâng cao', 'Thao tác đặt lệnh 1-Click ngay trên chart', 'Giao diện Dark Mode chống mỏi mắt'].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-zinc-300">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full border border-amber-500/50 flex items-center justify-center bg-amber-500/10">
                      <Zap className="h-3 w-3 text-amber-500" />
                    </div>
                    <span className="text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Feature Section 2 (Left Text, Right Image) ─── */}
      <section className="py-24 relative overflow-hidden bg-card/50">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-[80%] bg-gradient-to-l from-amber-900/10 to-transparent pointer-events-none" />

        <div className="container mx-auto px-4">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-16">

            <div className="w-full lg:w-1/2 space-y-8 relative z-10">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 shadow-xl shadow-emerald-500/20 mb-2">
                <ShieldCheck className="h-8 w-8 text-black" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                Bảo mật tuyệt đối <br />
                <span className="text-zinc-400">Minh bạch tài sản 100%.</span>
              </h2>
              <p className="text-xl text-zinc-500 leading-relaxed">
                Hệ thống lưu trữ lạnh (Cold Storage) & quản lý rủi ro tự động. Mọi giao dịch Nạp/Rút đều trải qua cơ chế kiểm duyệt độc lập từ bộ phận Finance Auditor chuyên nghiệp.
              </p>

              <div className="grid sm:grid-cols-2 gap-6 pt-6">
                <div className="p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm hover:border-emerald-500/30 hover:bg-emerald-500/5 transition">
                  <Lock className="h-8 w-8 text-emerald-500 mb-4" />
                  <h3 className="text-lg font-bold mb-2">Bảo vệ SSL 256-bit</h3>
                  <p className="text-sm text-zinc-400">Dữ liệu cá nhân và tài chính giao dịch được mã hóa đầu cuối hoàn toàn.</p>
                </div>
                <div className="p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm hover:border-emerald-500/30 hover:bg-emerald-500/5 transition">
                  <Shield className="h-8 w-8 text-emerald-500 mb-4" />
                  <h3 className="text-lg font-bold mb-2">Kiểm soát rủi ro</h3>
                  <p className="text-sm text-zinc-400">Cơ chế quản lý Max Loss tự động dừng khi phát hiện biến động phi lý.</p>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-1/2 relative group">
              <div className="absolute inset-0 bg-emerald-500/10 blur-[120px] rounded-full z-0 transition duration-700 group-hover:bg-emerald-500/20" />
              <div className="relative z-10 border border-white/10 rounded-3xl p-1 bg-gradient-to-bl from-white/10 to-transparent">
                <img
                  src="/images/section2.webp"
                  alt="Hệ thống bảo mật và tài khoản"
                  className="rounded-2xl shadow-2xl object-cover w-full opacity-90 transition duration-500 group-hover:opacity-100 group-hover:scale-[1.01]"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="py-32 relative overflow-hidden flex items-center justify-center text-center">
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <div className="w-full max-w-4xl aspect-[2/1] bg-gradient-to-t from-amber-600/20 to-transparent rounded-[100%] blur-[100px]" />
        </div>

        <div className="relative z-10 container px-4 max-w-3xl">
          <DollarSign className="h-16 w-16 text-amber-500 mx-auto mb-6 opacity-80" />
          <h2 className="text-4xl md:text-6xl font-black mb-6">Sẵn sàng để chiếm lĩnh thị trường?</h2>
          <p className="text-xl text-zinc-400 mb-10">
            Tạo tài khoản miễn phí và tham gia sân chơi của các nhà khởi nghiệp và giao dịch chuyên nghiệp ngay hôm nay.
          </p>
          <Button
            size="lg"
            onClick={() => isAuthenticated ? onNavigate('trading') : setShowAuthDrawer(true)}
            className="rounded-full shadow-[0_0_40px_rgba(245,158,11,0.3)] hover:shadow-[0_0_60px_rgba(245,158,11,0.5)] px-12 py-8 text-xl tracking-widest uppercase font-black"
          >
            {isAuthenticated ? 'Vào giao dịch' : 'Đăng ký miễn phí'}
          </Button>
        </div>
      </section>

      {/* Auth Drawer */}
      <AuthDrawer
        isOpen={showAuthDrawer}
        onClose={() => setShowAuthDrawer(false)}
      />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 1s ease-out;
        }
      `}</style>
    </div>
  );
};
