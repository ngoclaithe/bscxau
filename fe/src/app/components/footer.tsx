import React from 'react';
import { Twitter, MessageCircle, Github, FileText } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border/10 bg-card/30 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/images/logo2.webp" alt="BSCXAU Logo" className="h-8 w-8 rounded-full object-cover drop-shadow-md" />
              <span className="font-bold text-lg bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">BSCXAU</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Nền tảng giao dịch Vàng &amp; Dầu thô chuyên nghiệp.
            </p>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold mb-4">Sản phẩm</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-foreground cursor-pointer">Trading Terminal</li>
              <li className="hover:text-foreground cursor-pointer">Portfolio</li>
              <li className="hover:text-foreground cursor-pointer">Nạp / Rút tiền</li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Tài nguyên</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-foreground cursor-pointer flex items-center gap-2">
                <FileText className="h-3 w-3" />
                Tài liệu
              </li>
              <li className="hover:text-foreground cursor-pointer">Hướng dẫn</li>
              <li className="hover:text-foreground cursor-pointer">API Docs</li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-semibold mb-4">Cộng đồng</h3>
            <div className="flex gap-3">
              <a
                href="#"
                className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 BSCXAU. Professional Gold &amp; Oil Trading Platform.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="/terms" className="hover:text-foreground hover:underline transition-colors block">
              Điều khoản
            </a>
            <a href="/security" className="hover:text-foreground hover:underline transition-colors block">
              Bảo mật
            </a>
            <a href="/risk" className="hover:text-foreground hover:underline transition-colors block">
              Cảnh báo rủi ro
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
