export type LogSeverity = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface FBData {
  id: string;
  em: string | null;
  fn: string | null;
  ln: string | null;
  ph: string | null;
  country: string | null;
  client_ip_address: string | null;
  client_user_agent: string | null;
  fbc: string | null;
  fbp: string | null;
  external_id: string | null;
  leadId: number | null;
}

export interface ConversionEvent {
  id: number;
  currency: string | null;
  value: number | null;
  content_name: string | null;
  content_category: string | null;
  content_type: string | null;
  createdAt: string;
  leadId: number;
}

export interface Log {
  id: number;
  message: string | null;
  severity: LogSeverity | null;
  context: string | null;
  timestamp: string;
  leadId: number;
  FBData: FBData | null;
  ConversionEvent: ConversionEvent | null;
  fBDataId: string | null;
  conversionEventId: number | null;
}

export interface LogsResponse {
  logs: Log[];
  total: number;
}

export interface LogsFilterParams {
  page: number;
  pageSize: number;
  severity?: string;
  context?: string;
  leadId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}
