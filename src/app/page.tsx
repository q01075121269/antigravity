'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Vehicle, Equipment, Material } from '@/types';

type ActiveModal = 'vehicle' | 'equipment' | 'material' | 'repair' | null;

const DEFAULT_WORKERS = ['김반장', '이주임', '박대리', '최과장', '정기사'];

export default function MobileHomePage() {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 실시간 지표 상태
  const [stats, setStats] = useState({
    totalAssets: 0,
    repairing: 0,
    inspectSoon: 0,
    lowStock: 0,
  });

  // 자산 데이터
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  // 1. 차량 모달 폼 상태
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [vehicleAction, setVehicleAction] = useState<'출차' | '반납'>('출차');
  const [driver, setDriver] = useState<string>('김반장');
  const [mileage, setMileage] = useState<number>(0);

  // 2. 장비 모달 폼 상태
  const [selectedEquipId, setSelectedEquipId] = useState<string>('');
  const [equipWorker, setEquipWorker] = useState<string>('김반장');

  // 3. 자재 모달 폼 상태
  const [selectedMatId, setSelectedMatId] = useState<string>('');
  const [matWorker, setMatWorker] = useState<string>('김반장');
  const [matQuantity, setMatQuantity] = useState<number>(1);

  // 4. 고장신고 모달 폼 상태
  const [repairType, setRepairType] = useState<string>('장비·공구');
  const [repairTarget, setRepairTarget] = useState<string>('');
  const [repairDesc, setRepairDesc] = useState<string>('');
  const [repairReporter, setRepairReporter] = useState<string>('김반장');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      const [vRes, eRes, mRes] = await Promise.all([
        supabase.from('vehicles').select('*').order('vehicle_number'),
        supabase.from('equipment').select('*').order('name'),
        supabase.from('materials').select('*').order('name'),
      ]);

      const vData = (vRes.data as Vehicle[]) || [];
      const eData = (eRes.data as Equipment[]) || [];
      const mData = (mRes.data as Material[]) || [];

      setVehicles(vData);
      setEquipmentList(eData);
      setMaterials(mData);

      if (vData.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(vData[0].id);
        setMileage(vData[0].current_mileage);
      }
      if (eData.length > 0 && !selectedEquipId) {
        setSelectedEquipId(eData[0].id);
      }
      if (mData.length > 0 && !selectedMatId) {
        setSelectedMatId(mData[0].id);
      }

      // 지표 계산
      const repairingCount =
        vData.filter((v) => v.status === '정비중').length +
        eData.filter((e) => e.status === '수리중').length;

      const lowStockCount = mData.filter((m) => m.stock_qty <= m.min_stock).length;

      setStats({
        totalAssets: vData.length + eData.length,
        repairing: repairingCount,
        inspectSoon: 1,
        lowStock: lowStockCount,
      });
    } catch (err) {
      console.error('데이터 조회 오류:', err);
    }
  }, [selectedVehicleId, selectedEquipId, selectedMatId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 차량 선택 변경 시 주행거리 동기화
  const handleSelectVehicle = (id: string) => {
    setSelectedVehicleId(id);
    const target = vehicles.find((v) => v.id === id);
    if (target) {
      setMileage(target.current_mileage);
      setVehicleAction(target.status === '운행중' ? '반납' : '출차');
    }
  };

  // 1. 차량 출차/반납 제출
  const handleSubmitVehicle = async () => {
    if (!selectedVehicleId) return;
    setLoading(true);
    try {
      const target = vehicles.find((v) => v.id === selectedVehicleId);
      const newStatus = vehicleAction === '출차' ? '운행중' : '정상';

      await supabase.from('vehicle_logs').insert([
        {
          vehicle_id: selectedVehicleId,
          driver,
          action_type: vehicleAction,
          mileage: Number(mileage),
        },
      ]);

      await supabase
        .from('vehicles')
        .update({
          status: newStatus,
          current_mileage: Number(mileage),
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedVehicleId);

      showToast(`[차량 ${vehicleAction} 완료] ${target?.vehicle_number} (${mileage}km)`);
      setActiveModal(null);
      loadData();
    } catch {
      showToast('처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 2. 장비 대여/반납 제출
  const handleSubmitEquipment = async () => {
    if (!selectedEquipId) return;
    setLoading(true);
    try {
      const target = equipmentList.find((e) => e.id === selectedEquipId);
      const isBorrowing = target?.status !== '대여중';
      const actionType = isBorrowing ? '대여' : '반납';
      const newStatus = isBorrowing ? '대여중' : '정상';
      const newUser = isBorrowing ? equipWorker : null;

      await supabase.from('equipment_logs').insert([
        {
          equipment_id: selectedEquipId,
          worker: equipWorker,
          action_type: actionType,
        },
      ]);

      await supabase
        .from('equipment')
        .update({
          status: newStatus,
          current_user: newUser,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedEquipId);

      showToast(`[장비 ${actionType} 완료] ${target?.name} (${equipWorker})`);
      setActiveModal(null);
      loadData();
    } catch {
      showToast('처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 3. 자재 출고 제출
  const handleSubmitMaterial = async () => {
    if (!selectedMatId || matQuantity <= 0) return;
    setLoading(true);
    try {
      const target = materials.find((m) => m.id === selectedMatId);
      const newStock = Math.max(0, (target?.stock_qty || 0) - matQuantity);

      await supabase.from('material_logs').insert([
        {
          material_id: selectedMatId,
          worker: matWorker,
          action_type: '출고',
          quantity: matQuantity,
        },
      ]);

      await supabase
        .from('materials')
        .update({
          stock_qty: newStock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedMatId);

      showToast(`[자재 출고 완료] ${target?.name} -${matQuantity}개`);
      setMatQuantity(1);
      setActiveModal(null);
      loadData();
    } catch {
      showToast('처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 4. 고장/정비 긴급 접수 제출
  const handleSubmitRepair = async () => {
    if (!repairTarget || !repairDesc) {
      alert('대상물과 고장 내용을 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      await supabase.from('repair_logs').insert([
        {
          asset_type: repairType,
          asset_name: repairTarget,
          reporter: repairReporter,
          description: repairDesc,
          status: '접수',
        },
      ]);

      showToast(`[긴급 접수 완료] ${repairTarget} 접수되었습니다.`);
      setRepairTarget('');
      setRepairDesc('');
      setActiveModal(null);
      loadData();
    } catch {
      showToast('접수 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col justify-between p-4 pb-10">
      {/* 상단 헤더 */}
      <header className="border-b border-gray-200 pb-3 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              ADENHILL RESORT
            </span>
            <h1 className="text-xl font-black text-gray-900">현장 스마트 통합 관리</h1>
          </div>
          <Link
            href="/admin"
            className="text-xs font-bold bg-gray-800 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition"
          >
            ⚙️ 관리자
          </Link>
        </div>
      </header>

      {/* 알림 토스트 (터치 피드백) */}
      {toastMessage && (
        <div className="mb-4 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg text-center font-bold animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* 실시간 현황 요약 지표 */}
      <section className="mb-5 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xs font-bold text-gray-500 mb-2">실시간 자산 가동 현황</h2>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
            <div className="text-xs text-gray-500">총 자산</div>
            <div className="text-lg font-black text-gray-900">{stats.totalAssets}</div>
          </div>
          <div className="bg-orange-50 p-2 rounded-lg border border-orange-100">
            <div className="text-xs text-orange-700">수리중</div>
            <div className="text-lg font-black text-orange-700">{stats.repairing}</div>
          </div>
          <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-100">
            <div className="text-xs text-yellow-800">점검임박</div>
            <div className="text-lg font-black text-yellow-800">{stats.inspectSoon}</div>
          </div>
          <div className="bg-red-50 p-2 rounded-lg border border-red-100">
            <div className="text-xs text-red-700">재고부족</div>
            <div className="text-lg font-black text-red-700">{stats.lowStock}</div>
          </div>
        </div>
      </section>

      {/* 현장 작업자 1~2 터치 전용 버튼 리스트 */}
      <section className="space-y-3 flex-1">
        <h2 className="text-xs font-bold text-gray-500 mb-1">빠른 현장 처리 (원터치 선택)</h2>

        {/* 1. 차량 관리 */}
        <button
          onClick={() => setActiveModal('vehicle')}
          className="w-full bg-white border-2 border-gray-300 active:border-gray-900 active:bg-gray-100 p-4 rounded-xl text-left flex justify-between items-center transition shadow-sm"
        >
          <div>
            <div className="text-base font-bold text-gray-900">🚗 차량 출차 / 반납</div>
            <div className="text-xs text-gray-500 mt-0.5">운행 전후 주행거리 원터치 기록</div>
          </div>
          <span className="text-gray-400 font-bold text-xl">›</span>
        </button>

        {/* 2. 장비 및 공구 관리 */}
        <button
          onClick={() => setActiveModal('equipment')}
          className="w-full bg-white border-2 border-gray-300 active:border-gray-900 active:bg-gray-100 p-4 rounded-xl text-left flex justify-between items-center transition shadow-sm"
        >
          <div>
            <div className="text-base font-bold text-gray-900">🔧 장비 · 공구 대여 / 반납</div>
            <div className="text-xs text-gray-500 mt-0.5">관리번호 선택 및 불출/입고 확인</div>
          </div>
          <span className="text-gray-400 font-bold text-xl">›</span>
        </button>

        {/* 3. 주요자재 관리 */}
        <button
          onClick={() => setActiveModal('material')}
          className="w-full bg-white border-2 border-gray-300 active:border-gray-900 active:bg-gray-100 p-4 rounded-xl text-left flex justify-between items-center transition shadow-sm"
        >
          <div>
            <div className="text-base font-bold text-gray-900">📦 주요자재 출고 입력</div>
            <div className="text-xs text-gray-500 mt-0.5">배관/부속/전기 자재 수량 즉시 차감</div>
          </div>
          <span className="text-gray-400 font-bold text-xl">›</span>
        </button>

        {/* 4. 고장 및 정비 신고 */}
        <button
          onClick={() => setActiveModal('repair')}
          className="w-full bg-red-50 border-2 border-red-300 active:bg-red-100 p-4 rounded-xl text-left flex justify-between items-center transition shadow-sm"
        >
          <div>
            <div className="text-base font-bold text-red-800">⚠️ 고장 / 수리 긴급 신고</div>
            <div className="text-xs text-red-600 mt-0.5">현장 상황 한 줄 설명 및 즉시 접수</div>
          </div>
          <span className="text-red-400 font-bold text-xl">›</span>
        </button>
      </section>

      {/* 하단 푸터 */}
      <footer className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
        아덴힐 시설영선팀 스마트 시스템 (Phase 2 실시간 연동)
      </footer>

      {/* ======================================================== */}
      {/* 1. 차량 출차/반납 모달 */}
      {/* ======================================================== */}
      {activeModal === 'vehicle' && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-gray-900">🚗 차량 출차 / 반납</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* 차량 선택 */}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">차량 선택</label>
              <div className="grid grid-cols-1 gap-2">
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelectVehicle(v.id)}
                    className={`p-3 rounded-lg border-2 text-left flex justify-between items-center transition ${
                      selectedVehicleId === v.id
                        ? 'border-blue-600 bg-blue-50 font-bold'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-gray-900">{v.vehicle_number}</div>
                      <div className="text-xs text-gray-500">{v.model}</div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-bold ${
                        v.status === '운행중'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {v.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 작업 구분 (출차 / 반납) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVehicleAction('출차')}
                className={`py-3 rounded-xl font-black text-sm border-2 ${
                  vehicleAction === '출차'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200'
                }`}
              >
                출차
              </button>
              <button
                type="button"
                onClick={() => setVehicleAction('반납')}
                className={`py-3 rounded-xl font-black text-sm border-2 ${
                  vehicleAction === '반납'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-200'
                }`}
              >
                반납
              </button>
            </div>

            {/* 운전자 선택 */}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">운전자</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {DEFAULT_WORKERS.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setDriver(name)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-bold border ${
                      driver === name
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* 현재 주행거리 입력 */}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">
                현재 계기판 주행거리 (km)
              </label>
              <input
                type="number"
                value={mileage}
                onChange={(e) => setMileage(Number(e.target.value))}
                className="w-full p-3 border-2 border-gray-300 rounded-xl text-lg font-black text-gray-900 focus:border-blue-600 outline-none"
              />
            </div>

            <button
              onClick={handleSubmitVehicle}
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-base rounded-xl transition shadow"
            >
              {loading ? '처리 중...' : `확인 (${vehicleAction} 완료)`}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. 장비·공구 대여/반납 모달 */}
      {/* ======================================================== */}
      {activeModal === 'equipment' && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-gray-900">🔧 장비 · 공구 대여 / 반납</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* 공구 목록 */}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">
                대상 장비·공구 선택
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {equipmentList.map((eq) => (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => setSelectedEquipId(eq.id)}
                    className={`w-full p-3 rounded-lg border-2 text-left flex justify-between items-center transition ${
                      selectedEquipId === eq.id
                        ? 'border-blue-600 bg-blue-50 font-bold'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-gray-900">{eq.name}</div>
                      <div className="text-xs text-gray-500">
                        {eq.code} | {eq.location}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-bold ${
                        eq.status === '대여중'
                          ? 'bg-orange-100 text-orange-700'
                          : eq.status === '수리중'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {eq.status === '대여중' ? `${eq.current_user || ''} 대여중` : eq.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 작업자 선택 */}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">작업자</label>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_WORKERS.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setEquipWorker(name)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-bold border ${
                      equipWorker === name
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmitEquipment}
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-base rounded-xl transition shadow"
            >
              {loading
                ? '처리 중...'
                : equipmentList.find((e) => e.id === selectedEquipId)?.status === '대여중'
                ? '반납 완료'
                : '대여 불출 완료'}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. 주요자재 출고 모달 */}
      {/* ======================================================== */}
      {activeModal === 'material' && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-gray-900">📦 주요자재 출고 입력</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* 자재 선택 */}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">출고 자재 선택</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {materials.map((mat) => (
                  <button
                    key={mat.id}
                    type="button"
                    onClick={() => setSelectedMatId(mat.id)}
                    className={`w-full p-3 rounded-lg border-2 text-left flex justify-between items-center transition ${
                      selectedMatId === mat.id
                        ? 'border-blue-600 bg-blue-50 font-bold'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-gray-900">{mat.name}</div>
                      <div className="text-xs text-gray-500">{mat.spec}</div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-bold ${
                        mat.stock_qty <= mat.min_stock
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      재고 {mat.stock_qty} {mat.unit}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 출고 수량 증감 버튼 */}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">출고 수량</label>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setMatQuantity((q) => Math.max(1, q - 1))}
                  className="w-14 h-12 bg-gray-200 active:bg-gray-300 rounded-xl text-2xl font-black text-gray-800"
                >
                  -
                </button>
                <div className="flex-1 text-center py-2 text-2xl font-black text-gray-900 bg-gray-50 rounded-xl border border-gray-200">
                  {matQuantity}
                </div>
                <button
                  type="button"
                  onClick={() => setMatQuantity((q) => q + 1)}
                  className="w-14 h-12 bg-gray-200 active:bg-gray-300 rounded-xl text-2xl font-black text-gray-800"
                >
                  +
                </button>
              </div>
            </div>

            {/* 출고자 */}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">출고 작업자</label>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_WORKERS.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setMatWorker(name)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-bold border ${
                      matWorker === name
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmitMaterial}
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-base rounded-xl transition shadow"
            >
              {loading ? '처리 중...' : `자재 ${matQuantity}개 즉시 출고`}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. 고장 및 정비 긴급 신고 모달 */}
      {/* ======================================================== */}
      {activeModal === 'repair' && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-red-600">⚠️ 고장 / 수리 긴급 신고</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* 구분 */}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">자산 구분</label>
              <div className="grid grid-cols-4 gap-1.5">
                {['장비·공구', '차량', '시설물', '기타'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setRepairType(t)}
                    className={`py-2 text-xs rounded-lg font-bold border ${
                      repairType === t
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* 대상물 */}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">
                대상물 명칭 / 관리번호
              </label>
              <input
                type="text"
                value={repairTarget}
                onChange={(e) => setRepairTarget(e.target.value)}
                placeholder="예: 충전드릴 EQ-001, 포터2, 락커룸 배관 등"
                className="w-full p-3 border-2 border-gray-300 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-red-500"
              />
            </div>

            {/* 고장 내용 */}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">
                고장 / 정비 내용 (한 줄 설명)
              </label>
              <textarea
                rows={3}
                value={repairDesc}
                onChange={(e) => setRepairDesc(e.target.value)}
                placeholder="예: 작동 시 연기 발생 및 배터리 충전 불량"
                className="w-full p-3 border-2 border-gray-300 rounded-xl text-sm text-gray-900 outline-none focus:border-red-500"
              />
            </div>

            {/* 신고자 */}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">신고자</label>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_WORKERS.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setRepairReporter(name)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-bold border ${
                      repairReporter === name
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmitRepair}
              disabled={loading}
              className="w-full py-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-base rounded-xl transition shadow"
            >
              {loading ? '접수 중...' : '긴급 신고 접수 완료'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}