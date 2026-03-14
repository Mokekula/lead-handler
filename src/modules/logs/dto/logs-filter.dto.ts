export interface LogsFilterParams {
  page: number;
  pageSize: number;
  severity?: string;
  context?: string;
  leadId?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}
