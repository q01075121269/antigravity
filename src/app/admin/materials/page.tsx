'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Material } from '@/types';

export default function MaterialsAdminPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newMat, setNewMat] = useState({
    code: '',
    name: '',
    spec: '',
    unit: 'EA',
    stock_qty: 0,
    min_stock: 5,
  });

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('materials').select('*').order('code');
      if (data) setMaterials(data as Material[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMat.code || !newMat.name) {
      alert('자재코드와 품명을 입력해주세요.');
      return;
    }

    try {
      await supabase.from('materials').insert([
        {
          code: newMat.code,
          name: newMat.name,
          spec: newMat.spec || null,
          unit: newMat.unit,
          stock_qty: Number(newMat.stock_qty),
          min_stock: Number(newMat.min_stock),
        },
      ]);
      setShowAddModal(false);
      setNewMat({
        code: '',
        name: '',
        spec: '',
        unit: 'EA',
        stock_qty: 0,
        min_stock: 5,
      });
      fetchMaterials();
    } catch (err) {
      console.error(err);
      alert('등록 실패');
    }
  };

  const handleAdjustStock = async (id: string, current: number, delta: number) => {
    const nextQty = Math.max(0, current + delta);
    try {
      await supabase
        .from('materials')
        .update({
          stock_qty: nextQty,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      fetchMaterials();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`[${name}] 자재를 삭제하시겠습니까?`)) return;
    try {
      await supabase.from('materials').delete().eq('id', id);
      fetchMaterials();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm flex-shrink-0">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-gray-800">📦 주요자재 관리 (마스터)</h1>
          <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded">
            등록 자재 {materials.length}종
          </span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow transition"
        >
          + 신규 자재 등록
        </button>
      </header>

      <main className="flex-1 overflow-auto p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400 font-bold">자재 목록을 불러오는 중...</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                  <th className="p-4 font-semibold">자재코드</th>
                  <th className="p-4 font-semibold">품명</th>
                  <th className="p-4 font-semibold">규격</th>
                  <th className="p-4 font-semibold text-center">현재 재고</th>
                  <th className="p-4 font-semibold text-center">안전재고 기준</th>
                  <th className="p-4 font-semibold text-center">재고 조정 (+/-)</th>
                  <th className="p-4 font-semibold text-center">상태</th>
                  <th className="p-4 font-semibold text-center">관리</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => {
                  const isLow = m.stock_qty <= m.min_stock;
                  return (
                    <tr
                      key={m.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition ${
                        isLow ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <td className="p-4 font-mono font-bold text-gray-700">{m.code}</td>
                      <td className="p-4 font-bold text-gray-900">{m.name}</td>
                      <td className="p-4 text-gray-600 text-xs">{m.spec || '-'}</td>
                      <td className="p-4 text-center font-black text-lg text-gray-900">
                        {m.stock_qty.toLocaleString()}{' '}
                        <span className="text-xs font-normal text-gray-500">{m.unit}</span>
                      </td>
                      <td className="p-4 text-center text-gray-600 font-medium">
                        {m.min_stock} {m.unit}
                      </td>
                      <td className="p-4 text-center space-x-1">
                        <button
                          onClick={() => handleAdjustStock(m.id, m.stock_qty, -1)}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded font-bold text-xs"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleAdjustStock(m.id, m.stock_qty, 1)}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded font-bold text-xs"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleAdjustStock(m.id, m.stock_qty, 10)}
                          className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-bold text-xs"
                        >
                          +10
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded text-xs font-bold ${
                            isLow
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-green-100 text-green-700 border border-green-200'
                          }`}
                        >
                          {isLow ? '⚠️ 부족(발주필요)' : '정상'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDelete(m.id, m.name)}
                          className="text-xs text-red-600 hover:text-red-800 font-bold px-2 py-1"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 신규 등록 모달 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-gray-900 text-lg">신규 주요자재 등록</h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 font-bold">
                  ✕
                </button>
              </div>
              <form onSubmit={handleAddMaterial} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">자재코드</label>
                    <input
                      type="text"
                      required
                      placeholder="예: MAT-010"
                      value={newMat.code}
                      onChange={(e) => setNewMat({ ...newMat, code: e.target.value })}
                      className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">단위</label>
                    <input
                      type="text"
                      required
                      placeholder="EA, Roll, Box"
                      value={newMat.unit}
                      onChange={(e) => setNewMat({ ...newMat, unit: e.target.value })}
                      className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">품명</label>
                  <input
                    type="text"
                    required
                    placeholder="예: XL 배관 소켓 16A"
                    value={newMat.name}
                    onChange={(e) => setNewMat({ ...newMat, name: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">규격 / 사양</label>
                  <input
                    type="text"
                    placeholder="예: 16A 황동 일자형"
                    value={newMat.spec}
                    onChange={(e) => setNewMat({ ...newMat, spec: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">초기 재고수량</label>
                    <input
                      type="number"
                      value={newMat.stock_qty}
                      onChange={(e) =>
                        setNewMat({ ...newMat, stock_qty: Number(e.target.value) })
                      }
                      className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">안전재고 기준</label>
                    <input
                      type="number"
                      value={newMat.min_stock}
                      onChange={(e) =>
                        setNewMat({ ...newMat, min_stock: Number(e.target.value) })
                      }
                      className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
                <div className="pt-3 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-gray-100 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-200"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 rounded-lg text-xs font-bold text-white hover:bg-blue-700"
                  >
                    등록 완료
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
