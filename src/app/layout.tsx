import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Compass, BarChart3, Route, FileText, MessageSquare, Settings } from "lucide-react";

export const metadata: Metadata = {
  title: "BridgePath 跨界导航 - 让每一次转行都有路可循",
  description: "AI辅助大学生跨专业跨行业求职工具，提供能力迁移分析、行动路径规划、简历翻译和模拟面试服务",
};

const navItems = [
  { href: "/analyze", label: "能力图谱", icon: BarChart3 },
  { href: "/path", label: "行动路径", icon: Route },
  { href: "/resume", label: "简历翻译", icon: FileText },
  { href: "/interview", label: "模拟面试", icon: MessageSquare },
];

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">
              <span className="gradient-text">BridgePath</span>
              <span className="text-slate-400 text-sm ml-1.5 font-normal">跨界导航</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Settings */}
          <Link
            href="/settings"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">设置</span>
          </Link>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden border-t border-slate-100 px-2 py-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 whitespace-nowrap transition-all"
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
              <Compass className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm text-slate-500">
              BridgePath 跨界导航 - AI辅助跨专业求职
            </span>
          </div>
          <p className="text-xs text-slate-400">
            用AI的力量，让跨界不再迷茫
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
