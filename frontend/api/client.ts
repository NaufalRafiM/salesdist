/**
 * Strongly-typed HTTP Client connecting Frontend to Backend SQL API routes (/api/*)
 */

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private currentUserId: string | null = null;

  setCurrentUser(userId: string | null) {
    this.currentUserId = userId;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.currentUserId) {
      headers['x-user-id'] = this.currentUserId;
    }
    return headers;
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {})
      }
    });

    const isJson = res.headers.get('content-type')?.includes('application/json');
    const body = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const errorMsg = (typeof body === 'object' && body?.error) ? body.error : `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    return body as T;
  }

  // --- HEALTH & STATUS ---
  async checkHealth() {
    return this.request('/api/health');
  }

  // --- AUTH ---
  async login(email: string, password: string) {
    const res = await this.request<{ message: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.user?.id) {
      this.setCurrentUser(res.user.id);
    }
    return res;
  }

  async registerPic(data: any) {
    return this.request<{ message: string; user: any }>('/api/auth/register-pic', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async lookupStatus(query: string) {
    return this.request<{ user: any }>(`/api/auth/status-lookup?query=${encodeURIComponent(query)}`);
  }

  async getMe() {
    return this.request<{ user: any }>('/api/auth/me');
  }

  // --- PIC ---
  async getPicDashboard() {
    return this.request<{ summary: any; recent_reports: any[] }>('/api/pic/dashboard');
  }

  async getPicReports(filters: { status?: string; periode_mulai?: string; periode_selesai?: string; search?: string } = {}) {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.set('status', filters.status);
    if (filters.periode_mulai) queryParams.set('periode_mulai', filters.periode_mulai);
    if (filters.periode_selesai) queryParams.set('periode_selesai', filters.periode_selesai);
    if (filters.search) queryParams.set('search', filters.search);

    const qs = queryParams.toString();
    return this.request<{ reports: any[] }>(`/api/pic/reports${qs ? `?${qs}` : ''}`);
  }

  async submitPicReport(payload: any) {
    return this.request<{ message: string; nomor_laporan: string; laporan_id: string }>('/api/pic/reports', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async revisePicReport(id: string, payload: any) {
    return this.request<{ message: string }>(`/api/pic/reports/${id}/revise`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  async getNotifications() {
    return this.request<{ notifications: any[] }>('/api/pic/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request<{ success: boolean }>(`/api/pic/notifications/${id}/read`, {
      method: 'PUT'
    });
  }

  // --- ADMIN ---
  async getAdminDashboard() {
    return this.request<{ summary: any; sales_per_brand: any[]; sales_per_area: any[]; low_stock_alerts: any[] }>('/api/admin/dashboard');
  }

  async getPendingReports() {
    return this.request<{ reports: any[] }>('/api/admin/reports/pending');
  }

  async verifyReport(id: string, status: 'diterima' | 'ditolak', alasan_penolakan?: string) {
    return this.request<{ message: string }>(`/api/admin/reports/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ status, alasan_penolakan })
    });
  }

  async getFinancialRecap(filters: { tanggal_mulai?: string; tanggal_selesai?: string; area_id?: string; metode?: string; status?: string } = {}) {
    const queryParams = new URLSearchParams();
    if (filters.tanggal_mulai) queryParams.set('tanggal_mulai', filters.tanggal_mulai);
    if (filters.tanggal_selesai) queryParams.set('tanggal_selesai', filters.tanggal_selesai);
    if (filters.area_id) queryParams.set('area_id', filters.area_id);
    if (filters.metode) queryParams.set('metode', filters.metode);
    if (filters.status) queryParams.set('status', filters.status);

    const qs = queryParams.toString();
    return this.request<{ summary: any; payments: any[] }>(`/api/admin/finance${qs ? `?${qs}` : ''}`);
  }

  getFinancialCsvUrl() {
    return '/api/admin/finance/export-csv';
  }

  async getStockInventory() {
    return this.request<{ stocks: any[] }>('/api/admin/stock');
  }

  async updateStock(id: string, stok_tersedia: number, stok_minimum?: number) {
    return this.request<{ message: string }>(`/api/admin/stock/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ stok_tersedia, stok_minimum })
    });
  }

  async getPicVerifications() {
    return this.request<{ pics: any[] }>('/api/admin/pic-verifications');
  }

  async verifyPic(id: string, status: 'terverifikasi' | 'ditolak') {
    return this.request<{ message: string }>(`/api/admin/pic-verifications/${id}`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  }

  // --- MASTER DATA ---
  async getBrands() {
    return this.request<{ brands: any[] }>('/api/master/brands');
  }

  async createBrand(brand: any) {
    return this.request<{ message: string; brand: any }>('/api/master/brands', {
      method: 'POST',
      body: JSON.stringify(brand)
    });
  }

  async updateBrand(id: string, brand: any) {
    return this.request<{ message: string; brand: any }>(`/api/master/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(brand)
    });
  }

  async deleteBrand(id: string) {
    return this.request<{ message: string }>(`/api/master/brands/${id}`, {
      method: 'DELETE'
    });
  }

  async getAreas() {
    return this.request<{ areas: any[] }>('/api/master/areas');
  }

  async createArea(area: any) {
    return this.request<{ message: string; area: any }>('/api/master/areas', {
      method: 'POST',
      body: JSON.stringify(area)
    });
  }

  async updateArea(id: string, area: any) {
    return this.request<{ message: string; area: any }>(`/api/master/areas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(area)
    });
  }

  async deleteArea(id: string) {
    return this.request<{ message: string }>(`/api/master/areas/${id}`, {
      method: 'DELETE'
    });
  }

  async getWarehouses() {
    return this.request<{ warehouses: any[] }>('/api/master/warehouses');
  }

  async createWarehouse(wh: any) {
    return this.request<{ message: string; warehouse: any }>('/api/master/warehouses', {
      method: 'POST',
      body: JSON.stringify(wh)
    });
  }

  async updateWarehouse(id: string, wh: any) {
    return this.request<{ message: string; warehouse: any }>(`/api/master/warehouses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(wh)
    });
  }

  async deleteWarehouse(id: string) {
    return this.request<{ message: string }>(`/api/master/warehouses/${id}`, {
      method: 'DELETE'
    });
  }

  async getUsers() {
    return this.request<{ users: any[] }>('/api/master/users');
  }

  async createUser(user: any) {
    return this.request<{ message: string }>('/api/master/users', {
      method: 'POST',
      body: JSON.stringify(user)
    });
  }

  async deleteUser(id: string) {
    return this.request<{ message: string }>(`/api/master/users/${id}`, {
      method: 'DELETE'
    });
  }

  // --- SQL INSPECTION ---
  async getSqlSchema() {
    return this.request<{ engine: string; ddl: string; tables: { table_name: string; row_count: number }[] }>('/api/sql/schema');
  }

  async executeSqlQuery(sql_statement: string) {
    return this.request<{ query: string; row_count: number; results: any[] }>('/api/sql/query', {
      method: 'POST',
      body: JSON.stringify({ sql_statement })
    });
  }
}

export const api = new ApiClient();
export default api;
