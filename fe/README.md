# Binary Options DEX - Full Prototype

Nền tảng giao dịch Binary Options phi tập trung với thanh toán on-chain, được xây dựng với React, TypeScript, Zustand và Tailwind CSS.

## 🚀 Tính năng

### User Trading App

#### 1. **Landing & Onboarding**
- Hero section với thống kê real-time
- Giới thiệu Binary Options và Copy Trade
- CTA kết nối ví

#### 2. **Wallet & Account**
- Kết nối ví MetaMask/WalletConnect
- Hiển thị balance và network
- Account overview với PnL và Win Rate

#### 3. **Trading Terminal**
- Chart giá real-time (Recharts)
- Panel đặt lệnh với:
  - Chọn cặp giao dịch
  - Timeframe linh hoạt (1-15 phút)
  - Số tiền cược
  - Payout % hiển thị rõ ràng
- Nút UP/DOWN với màu sắc trực quan
- Countdown timer cho lệnh đang mở

#### 4. **Lệnh & Lịch sử**
- Open orders với real-time countdown
- Closed orders với kết quả WIN/LOSE
- Transaction hash on-chain
- Filter và search

#### 5. **Copy Trade**
- Danh sách top traders với:
  - Avatar, Win Rate, ROI
  - Risk score
  - Performance chart
  - Bio
- Copy settings:
  - % vốn copy
  - Max amount mỗi lệnh
  - Stop copy
- Real-time tracking

#### 6. **Leaderboard**
- Top 3 với medal system
- Full leaderboard table
- Filter theo timeframe (24h/7d/30d)
- Stats: Win Rate, ROI, PnL

#### 7. **Portfolio & Analytics**
- Tổng tài sản overview
- PnL chart
- Phân bổ theo pair (Pie chart)
- Recent performance
- Win/Lose statistics

#### 8. **Profile**
- Public profile với stats
- Bio customization
- Share profile link
- Copy trade settings (allow/disable)
- Account information

### Admin Dashboard (Back Office)

#### 1. **Admin Login**
- Secure login with 2FA mention
- Security warnings
- Demo credentials: admin/admin

#### 2. **Dashboard Tổng quan**
- KPI cards:
  - Total Volume
  - Total Payout
  - House Profit
  - Active Traders
- Charts:
  - Volume 7 ngày (Bar chart)
  - Win/Lose ratio (Pie chart)
- Risk Management overview
- Real-time alerts

#### 3. **Trade & Order Monitoring**
- Real-time order stream
- Filter by pair/status/result
- Detailed trade information
- Export functionality

#### 4. **Trader & Copy Trade Monitoring**
- Top traders ranking
- Search by address
- Suspicious activity detection
- Pause/Resume copy trading
- Detailed trader analytics

#### 5. **Pair & Payout Config**
- Enable/Disable pairs
- Adjust payout %
- Configure timeframes
- Min/Max amount settings
- Live editing

#### 6. **Analytics & Reports**
- User growth charts
- Trading volume trends
- Pair distribution
- Trading behavior analysis:
  - Timeframe preferences
  - Bet amount ranges
  - Peak trading hours
- Export PDF reports

## 🛠️ Tech Stack

- **Frontend Framework**: React 18
- **Language**: TypeScript
- **State Management**: Zustand (domain-separated stores)
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Icons**: Lucide React
- **UI Components**: Radix UI
- **Notifications**: Sonner
- **Animations**: Motion/React (Framer Motion)

## ✨ Key Features Implemented

### User Experience
- ✅ **Responsive Design**: Mobile, Tablet, Desktop optimized
- ✅ **Real-time Updates**: Live price feeds, countdown timers
- ✅ **Dark Mode**: Professional trading interface
- ✅ **Vietnamese Language**: Full localization
- ✅ **Guided Tour**: Interactive feature showcase
- ✅ **Wallet Integration**: Mock MetaMask/WalletConnect
- ✅ **Toast Notifications**: Success/Error feedback

### Trading Features
- ✅ **Live Chart**: Real-time price visualization (Recharts)
- ✅ **Quick Trading**: UP/DOWN buttons with color coding
- ✅ **Multiple Timeframes**: 1-15 minutes
- ✅ **Order Management**: Open orders with countdown, history
- ✅ **Payout Display**: Clear 85% profit calculation
- ✅ **Transaction Hash**: Simulated on-chain settlement

### Social Trading
- ✅ **Top Traders List**: Win rate, ROI, followers
- ✅ **Performance Charts**: 30-day history
- ✅ **Copy Settings**: Customizable %, max amount
- ✅ **Risk Indicators**: 1-10 risk score
- ✅ **Real-time Copying**: Auto-follow trades

### Analytics
- ✅ **Portfolio Dashboard**: PnL, Win rate, ROI
- ✅ **Charts**: Area charts, Pie charts, Bar charts
- ✅ **Trade Statistics**: By pair, timeframe, amount
- ✅ **Performance Tracking**: Recent trades list
- ✅ **Leaderboard**: Global rankings with medals

### Admin Panel
- ✅ **Secure Login**: Demo authentication
- ✅ **KPI Dashboard**: Volume, Payout, Profit metrics
- ✅ **Trade Monitoring**: Real-time order stream
- ✅ **Trader Management**: Suspicious activity detection
- ✅ **Pair Configuration**: Live payout editing
- ✅ **Risk Management**: Pool balance, exposure tracking
- ✅ **Analytics Reports**: User growth, behavior analysis

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── ui/              # Shared UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── badge.tsx
│   │   ├── header.tsx       # Main header/navigation
│   │   ├── price-chart.tsx  # Trading chart
│   │   ├── trading-panel.tsx
│   │   └── order-list.tsx
│   ├── pages/
│   │   ├── home-page.tsx
│   │   ├── trading-page.tsx
│   │   ├── copy-trade-page.tsx
│   │   ├── leaderboard-page.tsx
│   │   ├── portfolio-page.tsx
│   │   ├── profile-page.tsx
│   │   └── admin/           # Admin pages
│   │       ├── login-page.tsx
│   │       ├── dashboard-page.tsx
│   │       ├── trades-monitoring-page.tsx
│   │       ├── traders-page.tsx
│   │       ├── pairs-config-page.tsx
│   │       ├── analytics-page.tsx
│   │       └── admin-layout.tsx
│   └── App.tsx              # Main app with routing
├── stores/
│   ├── wallet-store.ts      # Wallet connection state
│   ├── trading-store.ts     # Trading & orders state
│   ├── copy-trade-store.ts  # Copy trading state
│   └── admin-store.ts       # Admin panel state
├── lib/
│   └── utils.ts             # Utility functions
└── styles/
    ├── index.css
    ├── tailwind.css
    └── theme.css            # Custom theme with Web3 colors
```

## 🎨 Design System

### Colors
- **Success/UP**: `#10b981` (Green)
- **Danger/DOWN**: `#ef4444` (Red)
- **Warning**: `#f59e0b` (Orange)
- **Info**: `#3b82f6` (Blue)
- **Web3 Gradient**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`

### Typography
- Rõ ràng, ưu tiên số liệu
- Font weights: 400 (normal), 500 (medium), 600+ (semibold/bold)

### Components
- **Button**: Variants (default, up, down, outline, ghost)
- **Card**: Container with border
- **Badge**: Status indicators
- **Input**: Form controls

## 🎮 Demo & Testing

### Khám phá Features
1. **Feature Tour**: Click nút "🎯 Feature Tour" ở góc dưới bên trái để xem guided tour
2. **Kết nối ví**: Click "Kết nối ví" ở header (mock wallet - tự động kết nối)
3. **Giao dịch**: Vào trang Trading, đặt lệnh UP/DOWN và xem countdown
4. **Copy Trade**: Browse top traders và setup copy settings
5. **Portfolio**: Xem analytics và PnL charts
6. **Admin**: Click "Admin" ở góc dưới phải

### 🔐 Admin Access

Click vào nút "Admin" ở góc dưới bên phải màn hình để truy cập Admin Dashboard.

**Demo Login:**
- Username: `admin`
- Password: `admin`

**Admin Features:**
- Dashboard với KPIs và charts
- Real-time trade monitoring
- Trader management với suspicious activity detection
- Pair configuration (live editing payout %)
- Risk management
- Detailed analytics & reports

## 📊 Data Flow

### User Flow
1. Kết nối ví → 2. Chọn pair & timeframe → 3. Đặt lệnh UP/DOWN → 4. Theo dõi countdown → 5. Nhận kết quả

### Copy Trade Flow
1. Xem danh sách traders → 2. Chọn trader → 3. Cài đặt copy (%, max amount) → 4. Auto-copy các lệnh

### Admin Flow
1. Login → 2. Dashboard overview → 3. Monitor trades/traders → 4. Configure pairs → 5. View analytics

## 🚧 Mock Data

Tất cả data hiện tại đều là mock/simulated:
- Price updates: Simulated với sine wave + random variation
- Trades: Auto-settle sau timeframe
- Traders: Generated với random stats
- Admin stats: Static mock data

## 📱 Responsive Design

- **Desktop**: Full layout với sidebar (Admin), multi-column grids
- **Tablet**: 2-column grids, collapsible navigation
- **Mobile**: Single column, hamburger menu, touch-optimized

## 🎯 Nguyên tắc UX

1. **Trading nhanh**: Ít click, UI rõ ràng
2. **Copy trade minh bạch**: Stats đầy đủ, risk warnings
3. **Cảnh báo rủi ro**: Badges, tooltips, alerts
4. **Real-time**: Live updates cho price, orders, alerts

## 🔄 State Management (Zustand)

### Wallet Store
- Connection status
- Address & balance
- Network info

### Trading Store
- Selected pair & timeframe
- Amount
- Open/Closed orders
- Price history

### Copy Trade Store
- Available traders
- Copied traders list
- Copy settings per trader

### Admin Store
- Authentication
- User role
- Platform stats
- Pair configs
- Risk data

## 🚀 Next Steps (Production)

1. **Backend Integration**
   - Real WebSocket for price feeds
   - Oracle integration
   - Smart contract interaction
   
2. **Authentication**
   - Web3 wallet signature authentication
   - 2FA implementation
   - Role-based access control

3. **Database**
   - User profiles
   - Trade history
   - Analytics data

4. **Advanced Features**
   - Social features (chat, forums)
   - Advanced charting (TradingView)
   - Mobile app (React Native)
   - Notifications system

## 📝 License

Prototype for demonstration purposes.

## 📊 Component Summary

### Total Components Created: 40+

**Pages (User):** 7
- HomePage, TradingPage, CopyTradePage, LeaderboardPage, PortfolioPage, ProfilePage, SettingsPage

**Pages (Admin):** 6
- LoginPage, DashboardPage, TradesMonitoringPage, TradersPage, PairsConfigPage, AnalyticsPage

**Shared Components:** 15+
- Header, Footer, PriceChart, TradingPanel, OrderList, LoadingSpinner, EmptyState, WalletConnectPrompt, FeatureTour, QuickStartGuide, StatsTicker, etc.

**UI Components:** 10+
- Button, Card, Input, Badge, and more from Radix UI

**Stores (Zustand):** 4
- wallet-store, trading-store, copy-trade-store, admin-store

## 🎨 Design Highlights

- **Color Scheme**: Dark mode với Web3 gradient accents
- **UP/DOWN**: Green (#10b981) / Red (#ef4444)
- **Charts**: Recharts với custom themes
- **Responsive**: Mobile-first approach
- **Accessibility**: ARIA labels, semantic HTML

## 🔧 Technical Highlights

- **Type Safety**: Full TypeScript coverage
- **State Management**: Zustand with domain separation
- **Mock Data**: Realistic simulated data for demo
- **Real-time Simulation**: Price updates, countdown timers
- **Modular Architecture**: Easy to extend and maintain

## 📝 Code Statistics

- **Lines of Code**: ~6,000+ lines
- **TypeScript Files**: 50+ files
- **Mock Traders**: 20+ with realistic stats
- **Mock Trades**: Real-time simulation
- **Chart Types**: Line, Bar, Area, Pie

---

**Built with ❤️ for Binary Options DEX**

**Tech Stack:** React 18 • TypeScript • Zustand • Tailwind CSS v4 • Recharts • Radix UI • Lucide Icons

**Status:** ✅ Prototype Complete & Ready for Demo

**Last Updated:** February 2, 2026
