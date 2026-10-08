'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RepairLog, Vehicle, Equipment, Material } from '@/types';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAssets: 0,
    repairing: 0,
    lowStock: 0,
    completedToday: 0,
  });
  const [logs, setLogs] = useState<RepairLog[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. 점검 및 수리 이력 최근 10건 조회
      const { data: repairLogs } = await supabase
        .from('repair_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (repairLogs) {
        setLogs(repairLogs as RepairLog[]);
      }

      // 2. 차량, 장비, 자재 집계
      const [vRes, eRes, mRes] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase.from('equipment').select('*'),
        supabase.from('materials').select('*'),
      ]);

      const vList = (vRes.data as Vehicle[]) || [];
      const eList = (eRes.data as Equipment[]) || [];
      const mList = (mRes.data as Material[]) || [];

      const repairingCount =
        vList.filter((v) => v.status === '정비중').length +
        eList.filter((e) => e.status === '수리중').length;

      const lowStockCount = mList.filter((m) => m.stock_qty <= m.min_stock).length;

      setStats({
        totalAssets: vList.length + eList.length,
        repairing: repairingCount,
        lowStock: lowStockCount,
        completedToday: (repairLogs || []).filter((r) => r.status === '완료').length,
      });
    } catch (err) {
      console.error('데이터 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // 수리 상태 변경
  const handleUpdateStatus = async (id: string, newStatus: '접수' | '수리중' | '완료') => {
    try {
      await supabase
        .from('repair_logs')
        .update({
          status: newStatus,
          resolved_at: newStatus === '완료' ? new Date().toISOString() : null,
        })
        .eq('id', id);

      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('상태 변경 실패');
    }
  };

  return (
    <>
      {/* 상단 헤더 */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm flex-shrink-0">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-gray-800">통합 대시보드</h1>
          <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded border border-green-200">
            실시간 DB 연결됨
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-bold text-gray-500">영선관리팀 담당자</span>
          <button
            onClick={fetchDashboardData}
            className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md font-bold border border-gray-200 hover:bg-gray-200 transition"
          >
            🔄 새로고침
          </button>
        </div>
      </header>

      {/* 대시보드 본문 */}
      <main className="flex-1 overflow-auto p-8">
        {/* 현황 요약 카드 4종 */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-blue-500">
            <div className="text-sm text-gray-500 mb-1 font-bold">총 등록 자산</div>
            <div className="text-3xl font-black text-gray-900">
              {loading ? '-' : stats.totalAssets}
              <span className="text-lg font-normal text-gray-400 ml-1">종</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-orange-500">
            <div className="text-sm text-gray-500 mb-1 font-bold">수리/정비 중</div>
            <div className="text-3xl font-black text-orange-600">
              {loading ? '-' : stats.repairing}
              <span className="text-lg font-normal text-gray-400 ml-1">건</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-red-500">
            <div className="text-sm text-gray-500 mb-1 font-bold">안전재고 미달 품목</div>
            <div className="text-3xl font-black text-red-600">
              {loading ? '-' : stats.lowStock}
              <span className="text-lg font-normal text-gray-400 ml-1">종</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-green-500">
            <div className="text-sm text-gray-500 mb-1 font-bold">수리 조치 완료</div>
            <div className="text-3xl font-black text-green-600">
              {loading ? '-' : stats.completedToday}
              <span className="text-lg font-normal text-gray-400 ml-1">건</span>
            </div>
          </div>
        </div>

        {/* 데이터 테이블 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-gray-800">최근 고장 및 정비 접수 내역 (실시간)</h2>
            <span className="text-xs text-gray-500">
              현장 모바일에서 등록된 긴급 신고가 즉시 반영됩니다
            </span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400 font-bold">데이터를 불러오는 중입니다...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              등록된 접수 내역이 없습니다. (현장 모바일에서 등록 시 즉시 표시됩니다)
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                  <th className="p-4 font-semibold">접수일시</th>
                  <th className="p-4 font-semibold">구분</th>
                  <th className="p-4 font-semibold">자산명 / 위치</th>
                  <th className="p-4 font-semibold">증상 내용</th>
                  <th className="p-4 font-semibold">신고자</th>
                  <th className="p-4 font-semibold">진행상태</th>
                  <th className="p-4 font-semibold text-center">관리 조치</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="p-4 text-gray-500 text-xs">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-medium text-gray-600">{item.asset_type}</td>
                    <td className="p-4 font-bold text-gray-900">{item.asset_name}</td>
                    <td className="p-4 text-gray-700">{item.description}</td>
                    <td className="p-4 text-gray-600">{item.reporter}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-bold ${
                          item.status === '완료'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : item.status === '수리중'
                            ? 'bg-orange-100 text-orange-700 border border-orange-200'
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-center space-x-1">
                      {item.status !== '수리중' && item.status !== '완료' && (
                        <button
                          onClick={() => handleUpdateStatus(item.id, '수리중')}
                          className="text-xs bg-orange-50 text-orange-700 border border-orange-300 px-2 py-1 rounded font-bold hover:bg-orange-100"
                        >
                          수리시작
                        </button>
                      )}
                      {item.status !== '완료' && (
                        <button
                          onClick={() => handleUpdateStatus(item.id, '완료')}
                          className="text-xs bg-green-50 text-green-700 border border-green-300 px-2 py-1 rounded font-bold hover:bg-green-100"
                        >
                          완료처리
                        </button>
                      )}
                      {item.status === '완료' && (
                        <span className="text-xs text-gray-400 font-bold">조치완료</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </>
  );
}