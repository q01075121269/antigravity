-- ========================================================
-- 아덴힐 스마트 통합 관리 시스템 Supabase DB 스키마
-- (차량, 장비·공구, 주요자재, 정비·수리, 운행/대여/출고 로그)
-- ========================================================

-- 1. 차량 마스터 (vehicles)
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number TEXT NOT NULL UNIQUE,          -- 차량번호 (예: 12가 3456)
  model TEXT NOT NULL,                          -- 차종/용도 (예: 포터2 더블캡, 스타렉스)
  current_mileage INT NOT NULL DEFAULT 0,       -- 현재 주행거리 (km)
  inspection_date DATE,                         -- 정기검사일
  insurance_date DATE,                          -- 보험만료일
  status TEXT NOT NULL DEFAULT '정상' CHECK (status IN ('정상', '운행중', '정비중')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 장비 및 공구 마스터 (equipment)
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,                    -- 관리번호 (예: EQ-001)
  name TEXT NOT NULL,                           -- 장비/공구명 (예: 보쉬 충전해머드릴)
  category TEXT NOT NULL DEFAULT '일반공구',    -- 분류 (전동공구, 에어공구, 측정기, 중장비 등)
  location TEXT DEFAULT '영선창고 A-1',         -- 보관위치
  status TEXT NOT NULL DEFAULT '정상' CHECK (status IN ('정상', '대여중', '수리중', '폐기')),
  current_user TEXT,                            -- 현재 대여자 이름
  contact_as TEXT,                              -- AS/수리업체 연락처
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 주요자재 마스터 (materials)
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,                    -- 자재코드 (예: MAT-PLUMB-01)
  name TEXT NOT NULL,                           -- 품명 (예: 엑셀 파이프 16A)
  spec TEXT,                                    -- 규격/단위 (예: 100m/롤)
  unit TEXT NOT NULL DEFAULT 'EA',              -- 단위 (EA, Roll, Box, m)
  stock_qty INT NOT NULL DEFAULT 0,             -- 현재 재고량
  min_stock INT NOT NULL DEFAULT 5,             -- 안전재고 기준수량
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 차량 운행/반납 로그 (vehicle_logs)
CREATE TABLE IF NOT EXISTS vehicle_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  driver TEXT NOT NULL,                         -- 운전자/작업자 이름
  action_type TEXT NOT NULL CHECK (action_type IN ('출차', '반납')),
  mileage INT NOT NULL,                         -- 입력된 주행거리
  destination TEXT,                             -- 목적지 / 업무내용
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 장비·공구 대여/반납 로그 (equipment_logs)
CREATE TABLE IF NOT EXISTS equipment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  worker TEXT NOT NULL,                         -- 작업자 이름
  action_type TEXT NOT NULL CHECK (action_type IN ('대여', '반납')),
  notes TEXT,                                   -- 용도 / 특이사항
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 주요자재 출고/입고 로그 (material_logs)
CREATE TABLE IF NOT EXISTS material_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  worker TEXT NOT NULL,                         -- 작업자 이름
  action_type TEXT NOT NULL CHECK (action_type IN ('출고', '입고')),
  quantity INT NOT NULL,                        -- 변경 수량
  reason TEXT,                                  -- 사용처 / 공사구간
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 점검 및 수리 긴급 신고 로그 (repair_logs)
CREATE TABLE IF NOT EXISTS repair_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type TEXT NOT NULL DEFAULT '기타',      -- 차량, 장비·공구, 자재, 시설물, 기타
  asset_name TEXT NOT NULL,                     -- 대상물 이름/번호
  reporter TEXT NOT NULL,                       -- 신고자
  description TEXT NOT NULL,                    -- 증상 / 고장 내용
  status TEXT NOT NULL DEFAULT '접수' CHECK (status IN ('접수', '수리중', '완료')),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- 초기 기초 데이터 샘플 (테스트 및 즉시 운용용)
-- ========================================================

-- 차량 기초 데이터
INSERT INTO vehicles (vehicle_number, model, current_mileage, inspection_date, insurance_date, status)
VALUES
  ('제주 80가 1234', '포터2 더블캡 (영선 1호)', 45200, CURRENT_DATE + INTERVAL '45 days', CURRENT_DATE + INTERVAL '120 days', '정상'),
  ('제주 81나 5678', '봉고3 4륜 (코스관리)', 68150, CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '90 days', '정상'),
  ('제주 77다 9988', '스타렉스 12인승 (지원차량)', 112000, CURRENT_DATE + INTERVAL '180 days', CURRENT_DATE + INTERVAL '30 days', '운행중')
ON CONFLICT (vehicle_number) DO NOTHING;

-- 장비/공구 기초 데이터
INSERT INTO equipment (code, name, category, location, status, contact_as)
VALUES
  ('EQ-001', '보쉬 충전 해머드릴 18V', '전동공구', '영선창고 A-1', '정상', '보쉬 제주AS (064-700-1111)'),
  ('EQ-002', '디월트 충전 임팩드라이버', '전동공구', '영선창고 A-2', '정상', '디월트 공인센터'),
  ('EQ-003', '혼다 엔진 예초기 4행정', '엔진장비', '장비고 B-3', '수리중', '제주 농기계상사 (064-755-2233)'),
  ('EQ-004', '마끼다 원형톱 7인치', '목공공구', '영선창고 A-3', '정상', '마끼다 고객센터'),
  ('EQ-005', '레이저 거리측정기 100m', '측정장비', '사무실 서랍', '정상', '신흥계측기')
ON CONFLICT (code) DO NOTHING;

-- 주요자재 기초 데이터
INSERT INTO materials (code, name, spec, unit, stock_qty, min_stock)
VALUES
  ('MAT-001', '엑셀 파이프 16A', '100m/Roll', 'Roll', 2, 5),   -- 안전재고 부족 샘플
  ('MAT-002', 'XL 부속 티(T) 16A', '황동/16A', 'EA', 45, 10),
  ('MAT-003', 'LED 매립등 6인치 (주광색)', '15W / 6500K', 'EA', 3, 10), -- 안전재고 부족 샘플
  ('MAT-004', '방수 실리콘 (투명)', '300ml', 'EA', 18, 6),
  ('MAT-005', 'CV 2.5sq 2C 전선', '100m', 'Roll', 4, 3)
ON CONFLICT (code) DO NOTHING;

-- 최근 수리/고장 신고 샘플
INSERT INTO repair_logs (asset_type, asset_name, reporter, description, status)
VALUES
  ('장비·공구', '혼다 엔진 예초기 4행정 (EQ-003)', '김반장', '시동 불량 및 캬브레타 오일 누유 발생', '수리중'),
  ('시설물', '클럽하우스 2층 남성락커 배관', '박대리', '수압 저하 및 이음새 미세 누수 점검 요청', '접수')
ON CONFLICT DO NOTHING;

-- RLS 정책 활성화 (공개 읽기/쓰기 허용 - 사내 내부망 및 현장 모바일용)
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all vehicles" ON vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all equipment" ON equipment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all materials" ON materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all vehicle_logs" ON vehicle_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all equipment_logs" ON equipment_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all material_logs" ON material_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all repair_logs" ON repair_logs FOR ALL USING (true) WITH CHECK (true);
