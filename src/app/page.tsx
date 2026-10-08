'use client';

import React, { useState } from 'react';

export default function MobileHomePage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerAction = (actionName: string) => {
    setToastMessage(`[접수 완료] ${actionName} 작업이 정상 처리되었습니다.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <main className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col justify-between p-4 pb-12">
      {/* 상단 헤더 */}
      <header className="border-b border-gray-200 pb-3 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">ADENHILL RESORT</span>
            <h1 className="text-xl font-black text-gray-900">현장 스마트 통합 관리</h1>
          </div>
          <span className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-bold">
            ● 실시간 정상
          </span>
        </div>
      </header>

      {/* 알림 토스트 (터치 피드백) */}
      {toastMessage && (
        <div className="mb-4 p-3 bg-gray-900 text-white text-sm rounded-lg shadow text-center font-medium">
          {toastMessage}
        </div>
      )}

      {/* 실시간 현황 요약 지표 */}
      <section className="mb-5 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xs font-bold text-gray-500 mb-2">실시간 자산 가동 현황</h2>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
            <div className="text-xs text-gray-500">총 자산</div>
            <div className="text-lg font-black text-gray-900">42</div>
          </div>
          <div className="bg-orange-50 p-2 rounded-lg border border-orange-100">
            <div className="text-xs text-orange-700">수리중</div>
            <div className="text-lg font-black text-orange-700">2</div>
          </div>
          <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-100">
            <div className="text-xs text-yellow-800">점검임박</div>
            <div className="text-lg font-black text-yellow-800">1</div>
          </div>
          <div className="bg-red-50 p-2 rounded-lg border border-red-100">
            <div className="text-xs text-red-700">재고부족</div>
            <div className="text-lg font-black text-red-700">3</div>
          </div>
        </div>
      </section>

      {/* 현장 작업자 1~2 터치 전용 버튼 */}
      <section className="space-y-3 flex-1">
        <h2 className="text-xs font-bold text-gray-500 mb-1">빠른 현장 처리 (1~2 터치 완료)</h2>

        {/* 1. 차량 관리 */}
        <button
          onClick={() => triggerAction('차량 출차')}
          className="w-full bg-white border-2 border-gray-300 active:border-gray-900 active:bg-gray-100 p-4 rounded-xl text-left flex justify-between items-center transition"
        >
          <div>
            <div className="text-base font-bold text-gray-900">🚗 차량 출차 / 반납</div>
            <div className="text-xs text-gray-500 mt-0.5">운행 전후 주행거리 원터치 기록</div>
          </div>
          <span className="text-gray-400 font-bold text-lg">›</span>
        </button>

        {/* 2. 장비 및 공구 관리 */}
        <button
          onClick={() => triggerAction('장비·공구 대여')}
          className="w-full bg-white border-2 border-gray-300 active:border-gray-900 active:bg-gray-100 p-4 rounded-xl text-left flex justify-between items-center transition"
        >
          <div>
            <div className="text-base font-bold text-gray-900">🔧 장비 · 공구 대여 / 반납</div>
            <div className="text-xs text-gray-500 mt-0.5">관리번호 선택 및 불출/입고 확인</div>
          </div>
          <span className="text-gray-400 font-bold text-lg">›</span>
        </button>

        {/* 3. 주요자재 관리 */}
        <button
          onClick={() => triggerAction('주요자재 출고')}
          className="w-full bg-white border-2 border-gray-300 active:border-gray-900 active:bg-gray-100 p-4 rounded-xl text-left flex justify-between items-center transition"
        >
          <div>
            <div className="text-base font-bold text-gray-900">📦 주요자재 출고 입력</div>
            <div className="text-xs text-gray-500 mt-0.5">배관/부속/전기 자재 수량 즉시 차감</div>
          </div>
          <span className="text-gray-400 font-bold text-lg">›</span>
        </button>

        {/* 4. 고장 및 정비 신고 */}
        <button
          onClick={() => triggerAction('긴급 정비 및 고장 접수')}
          className="w-full bg-red-50 border-2 border-red-300 active:bg-red-100 p-4 rounded-xl text-left flex justify-between items-center transition"
        >
          <div>
            <div className="text-base font-bold text-red-800">⚠️ 고장 / 수리 긴급 신고</div>
            <div className="text-xs text-red-600 mt-0.5">현장 사진 촬영 및 한 줄 설명 전송</div>
          </div>
          <span className="text-red-400 font-bold text-lg">›</span>
        </button>
      </section>

      {/* 하단 푸터 */}
      <footer className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
        아덴힐 시설영선팀 스마트 시스템 (Phase 1 뼈대 배포)
      </footer>
    </main>
  );
}