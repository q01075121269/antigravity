'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RepairLog } from '@/types';

export default function RepairsAdminPage() {
  const [logs, setLogs] = useState<RepairLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'전체' | '접수' | '수리중' | '완료'>('전체');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('repair_logs').select('*').order('created_at', { ascending: false });
      if (filter !== '전체') {
        query = query.eq('status', filter);
      }
      const { data } = await query;
      if (data) setLogs(data as RepairLog[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleUpdateStatus = async (id: string, newStatus: '접수' | '수리중' | '완료') => {
    try {
      await supabase
        .from('repair_logs')
        .update({
          status: newStatus,
          resolved_at: newStatus === '완료' ? new Date().toISOString() : null,
        })
        .eq('id', id);
      fetchLogs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('해당 정비 이력을 삭제하시겠습니까?')) return;
    try {
      await supabase.from('repair_logs').delete().eq('id', id);
      fetchLogs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm flex-shrink-0">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-gray-800">⚠️ 점검 및 수리 이력</h1>
          <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded">
            총 {logs.length}건
          </span>
        </div>
        {/* 필터 탭 */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {(['전체', '접수', '수리중', '완료'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                filter === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400 font-bold">내역을 불러오는 중...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">해당 상태의 내역이 없습니다.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                  <th className="p-4 font-semibold">접수일시</th>
                  <th className="p-4 font-semibold">자산구분</th>
                  <th className="p-4 font-semibold">자산명 / 위치</th>
                  <th className="p-4 font-semibold">고장 / 정비 내용</th>
                  <th className="p-4 font-semibold">신고자</th>
                  <th className="p-4 font-semibold">상태</th>
                  <th className="p-4 font-semibold text-center">조치 관리</th>
                  <th className="p-4 font-semibold text-center">삭제</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="p-4 text-xs text-gray-500">
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
                          수리중 변경
                        </button>
                      )}
                      {item.status !== '완료' && (
                        <button
                          onClick={() => handleUpdateStatus(item.id, '완료')}
                          className="text-xs bg-green-50 text-green-700 border border-green-300 px-2 py-1 rounded font-bold hover:bg-green-100"
                        >
                          완료 처리
                        </button>
                      )}
                      {item.status === '완료' && (
                        <span className="text-xs text-gray-400 font-bold">
                          {item.resolved_at
                            ? `${new Date(item.resolved_at).toLocaleDateString()} 완료됨`
                            : '완료됨'}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-xs text-red-600 hover:text-red-800 font-bold px-2 py-1"
                      >
                        삭제
                      </button>
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
