export interface Vehicle {
  id: string;
  vehicle_number: string;
  model: string;
  current_mileage: number;
  inspection_date: string | null;
  insurance_date: string | null;
  status: '정상' | '운행중' | '정비중';
  created_at?: string;
  updated_at?: string;
}

export interface Equipment {
  id: string;
  code: string;
  name: string;
  category: string;
  location: string;
  status: '정상' | '대여중' | '수리중' | '폐기';
  current_user: string | null;
  contact_as: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Material {
  id: string;
  code: string;
  name: string;
  spec: string | null;
  unit: string;
  stock_qty: number;
  min_stock: number;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleLog {
  id?: string;
  vehicle_id: string;
  driver: string;
  action_type: '출차' | '반납';
  mileage: number;
  destination?: string;
  created_at?: string;
}

export interface EquipmentLog {
  id?: string;
  equipment_id: string;
  worker: string;
  action_type: '대여' | '반납';
  notes?: string;
  created_at?: string;
}

export interface MaterialLog {
  id?: string;
  material_id: string;
  worker: string;
  action_type: '출고' | '입고';
  quantity: number;
  reason?: string;
  created_at?: string;
}

export interface RepairLog {
  id: string;
  asset_type: string;
  asset_name: string;
  reporter: string;
  description: string;
  status: '접수' | '수리중' | '완료';
  resolved_at?: string | null;
  created_at: string;
}
