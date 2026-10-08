'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: '📊 통합 대시보드' },
    { href: '/admin/vehicles', label: '🚗 차량 관리 (마스터)' },
    { href: '/admin/equipment', label: '🔧 장비·공구 관리' },
    { href: '/admin/materials', label: '📦 주요자재 관리' },
    { href: '/admin/repairs', label: '⚠️ 점검 및 수리 이력' },
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* 왼쪽 사이드바 */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-xl z-10 flex-shrink-0">
        <div className="p-6 text-xl font-black border-b border-gray-800 tracking-tight">
          아덴힐 관리자 센터
        </div>
        <nav className="flex-1 p-4 space-y-1.5 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block p-3 rounded-lg transition font-bold ${
                  isActive
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="pt-4 border-t border-gray-800 mt-4">
            <Link
              href="/"
              className="block p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition text-center font-bold text-gray-200"
            >
              📱 현장 모바일 화면 가기
            </Link>
          </div>
        </nav>
        <div className="p-4 text-xs text-gray-500 border-t border-gray-800">
          시스템 버전: v1.2 (Smart ADENHILL)
        </div>
      </aside>

      {/* 우측 메인 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
