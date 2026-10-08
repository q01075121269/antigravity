'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Vehicle } from '@/types';

export default function VehiclesAdminPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // 새 차량 등록 상태
  const [newVehicle, setNewVehicle] = useState({
    vehicle_number: '',
    model: '',
    current_mileage: 0,
    inspection_date: '',
    insurance_date: '',
  });

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('vehicles').select('*').order('vehicle_number');
      if (data) setVehicles(data as Vehicle[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.vehicle_number || !newVehicle.model) {
      alert('차량번호와 차종을 입력해주세요.');
      return;
    }

    try {
      await supabase.from('vehicles').insert([
        {
          vehicle_number: newVehicle.vehicle_number,
          model: newVehicle.model,
          current_mileage: Number(newVehicle.current_mileage),
          inspection_date: newVehicle.inspection_date || null,
          insurance_date: newVehicle.insurance_date || null,
          status: '정상',
        },
      ]);
      setShowAddModal(false);
      setNewVehicle({
        vehicle_number: '',
        model: '',
        current_mileage: 0,
        inspection_date: '',
        insurance_date: '',
      });
      fetchVehicles();
    } catch (err) {
      console.error(err);
      alert('등록 실패');
    }
  };

  const handleUpdateStatus = async (id: string, status: '정상' | '운행중' | '정비중') => {
    try {
      await supabase.from('vehicles').update({ status }).eq('id', id);
      fetchVehicles();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, num: string) => {
    if (!confirm(`차량 [${num}]을(를) 삭제하시겠습니까?`)) return;
    try {
      await supabase.from('vehicles').delete().eq('id', id);
      fetchVehicles();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm flex-shrink-0">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-gray-800">🚗 차량 관리 (마스터)</h1>
          <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded">
            등록 차량 {vehicles.length}대
          </span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow transition"
        >
          + 신규 차량 등록
        </button>
      </header>

      <main className="flex-1 overflow-auto p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400 font-bold">차량 목록을 불러오는 중...</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                  <th className="p-4 font-semibold">차량번호</th>
                  <th className="p-4 font-semibold">차종 / 용도</th>
                  <th className="p-4 font-semibold">현재 주행거리</th>
                  <th className="p-4 font-semibold">정기검사일</th>
                  <th className="p-4 font-semibold">보험만료일</th>
                  <th className="p-4 font-semibold">운행상태</th>
                  <th className="p-4 font-semibold text-center">관리</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="p-4 font-black text-gray-900">{v.vehicle_number}</td>
                    <td className="p-4 text-gray-700">{v.model}</td>
                    <td className="p-4 font-bold text-gray-900">
                      {v.current_mileage.toLocaleString()} km
                    </td>
                    <td className="p-4 text-gray-600 text-xs">
                      {v.inspection_date || '-'}
                    </td>
                    <td className="p-4 text-gray-600 text-xs">
                      {v.insurance_date || '-'}
                    </td>
                    <td className="p-4">
                      <select
                        value={v.status}
                        onChange={(e) =>
                          handleUpdateStatus(v.id, e.target.value as '정상' | '운행중' | '정비중')
                        }
                        className={`text-xs font-bold px-2.5 py-1 rounded border outline-none ${
                          v.status === '운행중'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : v.status === '정비중'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                        }`}
                      >
                        <option value="정상">정상</option>
                        <option value="운행중">운행중</option>
                        <option value="정비중">정비중</option>
                      </select>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(v.id, v.vehicle_number)}
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
                <h3 className="font-bold text-gray-900 text-lg">신규 차량 등록</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 font-bold"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleAddVehicle} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">차량번호</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 제주 80가 1234"
                    value={newVehicle.vehicle_number}
                    onChange={(e) =>
                      setNewVehicle({ ...newVehicle, vehicle_number: e.target.value })
                    }
                    className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">차종 / 용도</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 포터2 더블캡 (영선 1호)"
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">
                    현재 주행거리 (km)
                  </label>
                  <input
                    type="number"
                    value={newVehicle.current_mileage}
                    onChange={(e) =>
                      setNewVehicle({ ...newVehicle, current_mileage: Number(e.target.value) })
                    }
                    className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-blue-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">정기검사일</label>
                    <input
                      type="date"
                      value={newVehicle.inspection_date}
                      onChange={(e) =>
                        setNewVehicle({ ...newVehicle, inspection_date: e.target.value })
                      }
                      className="w-full p-2.5 border rounded-lg text-xs outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">보험만료일</label>
                    <input
                      type="date"
                      value={newVehicle.insurance_date}
                      onChange={(e) =>
                        setNewVehicle({ ...newVehicle, insurance_date: e.target.value })
                      }
                      className="w-full p-2.5 border rounded-lg text-xs outline-none focus:border-blue-600"
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
