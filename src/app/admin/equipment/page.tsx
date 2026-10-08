'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Equipment } from '@/types';

export default function EquipmentAdminPage() {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newEquip, setNewEquip] = useState({
    code: '',
    name: '',
    category: '전동공구',
    location: '영선창고 A-1',
    contact_as: '',
  });

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('equipment').select('*').order('code');
      if (data) setEquipmentList(data as Equipment[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEquip.code || !newEquip.name) {
      alert('관리번호와 장비명을 입력해주세요.');
      return;
    }

    try {
      await supabase.from('equipment').insert([
        {
          code: newEquip.code,
          name: newEquip.name,
          category: newEquip.category,
          location: newEquip.location,
          contact_as: newEquip.contact_as || null,
          status: '정상',
        },
      ]);
      setShowAddModal(false);
      setNewEquip({
        code: '',
        name: '',
        category: '전동공구',
        location: '영선창고 A-1',
        contact_as: '',
      });
      fetchEquipment();
    } catch (err) {
      console.error(err);
      alert('등록 실패');
    }
  };

  const handleUpdateStatus = async (
    id: string,
    status: '정상' | '대여중' | '수리중' | '폐기',
  ) => {
    try {
      await supabase
        .from('equipment')
        .update({
          status,
          current_user: status === '대여중' ? '관리자지정' : null,
        })
        .eq('id', id);
      fetchEquipment();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`[${name}]을(를) 삭제하시겠습니까?`)) return;
    try {
      await supabase.from('equipment').delete().eq('id', id);
      fetchEquipment();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm flex-shrink-0">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-gray-800">🔧 장비 · 공구 관리 (마스터)</h1>
          <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded">
            등록 공구 {equipmentList.length}건
          </span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow transition"
        >
          + 신규 장비·공구 등록
        </button>
      </header>

      <main className="flex-1 overflow-auto p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400 font-bold">장비 목록을 불러오는 중...</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                  <th className="p-4 font-semibold">관리번호</th>
                  <th className="p-4 font-semibold">장비·공구명</th>
                  <th className="p-4 font-semibold">분류</th>
                  <th className="p-4 font-semibold">보관위치</th>
                  <th className="p-4 font-semibold">현재상태 / 대여자</th>
                  <th className="p-4 font-semibold">A/S 연락처</th>
                  <th className="p-4 font-semibold text-center">관리</th>
                </tr>
              </thead>
              <tbody>
                {equipmentList.map((eq) => (
                  <tr key={eq.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="p-4 font-mono font-bold text-gray-700">{eq.code}</td>
                    <td className="p-4 font-bold text-gray-900">{eq.name}</td>
                    <td className="p-4 text-gray-600 text-xs">{eq.category}</td>
                    <td className="p-4 text-gray-600 text-xs">{eq.location}</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <select
                          value={eq.status}
                          onChange={(e) =>
                            handleUpdateStatus(
                              eq.id,
                              e.target.value as '정상' | '대여중' | '수리중' | '폐기',
                            )
                          }
                          className={`text-xs font-bold px-2 py-1 rounded border outline-none ${
                            eq.status === '대여중'
                              ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : eq.status === '수리중'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : eq.status === '폐기'
                              ? 'bg-gray-100 text-gray-400 border-gray-300'
                              : 'bg-green-50 text-green-700 border-green-200'
                          }`}
                        >
                          <option value="정상">정상</option>
                          <option value="대여중">대여중</option>
                          <option value="수리중">수리중</option>
                          <option value="폐기">폐기</option>
                        </select>
                        {eq.current_user && (
                          <span className="text-xs text-orange-600 font-bold">
                            ({eq.current_user})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">{eq.contact_as || '-'}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(eq.id, eq.name)}
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

        {/* 신규 등록 모달 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-gray-900 text-lg">신규 장비·공구 등록</h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 font-bold">
                  ✕
                </button>
              </div>
              <form onSubmit={handleAddEquipment} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">관리번호</label>
                    <input
                      type="text"
                      required
                      placeholder="예: EQ-010"
                      value={newEquip.code}
                      onChange={(e) => setNewEquip({ ...newEquip, code: e.target.value })}
                      className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">분류</label>
                    <select
                      value={newEquip.category}
                      onChange={(e) => setNewEquip({ ...newEquip, category: e.target.value })}
                      className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-600"
                    >
                      <option value="전동공구">전동공구</option>
                      <option value="에어공구">에어공구</option>
                      <option value="목공공구">목공공구</option>
                      <option value="엔진장비">엔진장비</option>
                      <option value="측정장비">측정장비</option>
                      <option value="일반공구">일반공구</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">장비·공구명</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 마끼다 슬라이딩 각도절단기"
                    value={newEquip.name}
                    onChange={(e) => setNewEquip({ ...newEquip, name: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">보관 위치</label>
                  <input
                    type="text"
                    placeholder="예: 영선창고 A-2 수납함"
                    value={newEquip.location}
                    onChange={(e) => setNewEquip({ ...newEquip, location: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">
                    A/S 센터 연락처
                  </label>
                  <input
                    type="text"
                    placeholder="예: 마끼다 제주센터 (064-123-4567)"
                    value={newEquip.contact_as}
                    onChange={(e) => setNewEquip({ ...newEquip, contact_as: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-600"
                  />
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
