'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface LogItem {
  id: string;
  created_at: string;
  asset_name: string;
  description: string;
  reporter: string;
  status: string;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAssets: 0,
    repairing: 0,
    lowStock: 0,
    completedToday: 0,
  });
  const [logs, setLogs] = useState<LogItem[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        // 1. 점검 및 수리 이력 최근 5건 조회
        const { data: repairLogs, error: logError } = await supabase
          .from('repair_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (!logError && repairLogs) {
          setLogs(repairLogs);
        }

        // 2. 자산 통계 집계 (테이블이 비어있어도 오류 없이 0으로 표시)
        const { count: assetCount } = await supabase
          .from('assets')
          .select('*', { count: 'exact', head: true });

        const { count: repairCount } = await supabase
          .from('assets')
          .select('*', { count: 'exact', head: true })
          .eq('status', '수리중');

        setStats({
          totalAssets: assetCount || 0,
          repairing: repairCount || 0,
          lowStock: 0,
          completedToday: repairLogs ? repairLogs.length : 0,
        });
      } catch (err) {
        console.error('데이터 조회 오류:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* 왼쪽 사이드바 (PC 전용 메뉴) */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-xl z-10">
        <div className="p-6 text-xl font-black border-b border-gray-800 tracking-tight">
          아덴힐 관리자 센터
        </div>
        <nav className="flex-1 p-4 space-y-2 text-sm font-medium">
          <a href="#" className="block p-3 bg-blue-600 rounded-lg text-white shadow">📊 통합 대시보드</a>
          <a href="#" className="block p-3 hover:bg-gray-800 rounded-lg transition text-gray-300 hover:text-white">🚗 차량 관리 (마스터)</a>
          <a href="#" className="block p-3 hover:bg-gray-800 rounded-lg transition text-gray-300 hover:text-white">🔧 장비·공구 관리</a>
          <a href="#" className="block p-3 hover:bg-gray-800 rounded-lg transition text-gray-300 hover:text-white">📦 주요자재 관리</a>
          <a href="#" className="block p-3 hover:bg-gray-800 rounded-lg transition text-gray-300 hover:text-white">⚠️ 점검 및 수리 이력</a>
        </nav>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 상단 헤더 */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-gray-800">통합 대시보드</h1>
            <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded border border-green-200">
              실시간 DB 연결됨
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-bold text-gray-500">영선대리 관리자님</span>
            <button className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-md font-bold border border-gray-200 hover:bg-gray-200">
              로그아웃
            </button>
          </div>
        </header>

        {/* 대시보드 본문 */}
        <div className="flex-1 overflow-auto p-8">
          {/* 현황 요약 카드 4종 */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-blue-500">
              <div className="text-sm text-gray-500 mb-1 font-bold">총 등록 자산</div>
              <div className="text-3xl font-black text-gray-900">
                {loading ? '-' : stats.totalAssets}
                <span className="text-lg font-normal text-gray-400 ml-1">건</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-orange-500">
              <div className="text-sm text-gray-500 mb-1 font-bold">수리/점검 중</div>
              <div className="text-3xl font-black text-gray-900">
                {loading ? '-' : stats.repairing}
                <span className="text-lg font-normal text-gray-400 ml-1">건</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-red-500">
              <div className="text-sm text-gray-500 mb-1 font-bold">안전재고 미달 자재</div>
              <div className="text-3xl font-black text-gray-900">
                {loading ? '-' : stats.lowStock}
                <span className="text-lg font-normal text-gray-400 ml-1">건</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-green-500">
              <div className="text-sm text-gray-500 mb-1 font-bold">금일 접수 건</div>
              <div className="text-3xl font-black text-gray-900">
                {loading ? '-' : stats.completedToday}
                <span className="text-lg font-normal text-gray-400 ml-1">건</span>
              </div>
            </div>
          </div>

          {/* 데이터 테이블 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="font-bold text-gray-800">최근 고장 및 정비 접수 내역 (실시간)</h2>
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-400">데이터를 불러오는 중입니다...</div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                등록된 접수 내역이 없습니다. (현장 모바일에서 등록 시 즉시 표시됩니다)
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                    <th className="p-4 font-semibold">접수일시</th>
                    <th className="p-4 font-semibold">자산구분</th>
                    <th className="p-4 font-semibold">상세내용</th>
                    <th className="p-4 font-semibold">신고자</th>
                    <th className="p-4 font-semibold">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="p-4">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="p-4 font-bold text-gray-900">{item.asset_name}</td>
                      <td className="p-4 text-gray-600">{item.description}</td>
                      <td className="p-4">{item.reporter}</td>
                      <td className="p-4">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-200">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}