const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:3001";

export const imageUrl = (path: string | null | undefined): string => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) return path;
  return `${API_URL}${path}`;
};

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const token = (() => {
    try {
      const raw = localStorage.getItem("storetrack-session");
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed._token;
      }
    } catch { /* ignore */ }
    return null;
  })();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) return res.json();
  if (contentType?.includes("text/csv")) return res.text();
  return res.json();
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  getMe: () => request("/api/auth/me"),
  updateMe: (data: any) => request("/api/auth/me", { method: "PUT", body: JSON.stringify(data) }),

  // Products
  getProducts: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request(`/api/products${qs}`);
  },
  getProduct: (id: string) => request(`/api/products/${id}`),
  createProduct: (data: any) => request("/api/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) => request(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProduct: (id: string) => request(`/api/products/${id}`, { method: "DELETE" }),
  restockProduct: (id: string, data: any) => request(`/api/products/${id}/restock`, { method: "POST", body: JSON.stringify(data) }),
  duplicateProduct: (id: string) => request(`/api/products/${id}/duplicate`, { method: "POST" }),
  getProductSales: (id: string) => request(`/api/products/${id}/sales`),
  getProductAudit: (id: string) => request(`/api/products/${id}/audit`),
  uploadProductImage: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const token = (() => {
      try {
        const raw = localStorage.getItem("storetrack-session");
        if (raw) return JSON.parse(raw)._token;
      } catch { /* ignore */ }
      return null;
    })();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/api/products/${id}/image`, { method: "POST", headers, body: formData });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `Upload failed: ${res.status}`);
    }
    return res.json();
  },
  deleteProductImage: (id: string) => request(`/api/products/${id}/image`, { method: "DELETE" }),

  // Categories
  getCategories: () => request("/api/categories"),
  createCategory: (data: any) => request("/api/categories", { method: "POST", body: JSON.stringify(data) }),
  updateCategory: (id: string, data: any) => request(`/api/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCategory: (id: string) => request(`/api/categories/${id}`, { method: "DELETE" }),

  // Sales
  getSales: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request(`/api/sales${qs}`);
  },
  getSale: (id: string) => request(`/api/sales/${id}`),
  createSale: (data: any) => request("/api/sales", { method: "POST", body: JSON.stringify(data) }),

  // Customers
  getCustomers: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request(`/api/customers${qs}`);
  },
  getCustomer: (id: string) => request(`/api/customers/${id}`),
  createCustomer: (data: any) => request("/api/customers", { method: "POST", body: JSON.stringify(data) }),
  updateCustomer: (id: string, data: any) => request(`/api/customers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCustomer: (id: string) => request(`/api/customers/${id}`, { method: "DELETE" }),
  getCustomerLedger: (id: string) => request(`/api/customers/${id}/ledger`),
  getCustomerSummary: (id: string) => request(`/api/customers/${id}/summary`),
  recordPayment: (id: string, data: any) => request(`/api/customers/${id}/payments`, { method: "POST", body: JSON.stringify(data) }),
  getCustomerSummaryAgg: () => request("/api/customers/summary"),

  // Users
  getUsers: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request(`/api/users${qs}`);
  },
  createUser: (data: any) => request("/api/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id: string, data: any) => request(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateUserStatus: (id: string, data: any) => request(`/api/users/${id}/status`, { method: "PUT", body: JSON.stringify(data) }),
  deleteUser: (id: string) => request(`/api/users/${id}`, { method: "DELETE" }),
  resetUserPassword: (id: string) => request(`/api/users/${id}/reset-password`, { method: "POST" }),

  // Dashboard
  getKPIs: () => request("/api/dashboard/kpis"),
  getRevenue: () => request("/api/dashboard/revenue"),
  getActivity: () => request("/api/dashboard/activity"),
  getBestSellers: () => request("/api/dashboard/best-sellers"),
  getCategoryBreakdown: () => request("/api/dashboard/categories"),

  // Reports
  getReportMetrics: () => request("/api/reports/metrics"),
  getRevenueTrend: (days?: number) => request(`/api/reports/revenue-trend?days=${days || 30}`),
  getTopProducts: () => request("/api/reports/top-products"),
  getAuditLog: () => request("/api/reports/audit-log"),
  exportReport: (format: string) => request(`/api/reports/export?format=${format}`),

  // Settings
  getSettings: () => request("/api/settings"),
  updateStoreSettings: (data: any) => request("/api/settings/store", { method: "PUT", body: JSON.stringify(data) }),
  updateInventorySettings: (data: any) => request("/api/settings/inventory", { method: "PUT", body: JSON.stringify(data) }),
  updateSecuritySettings: (data: any) => request("/api/settings/security", { method: "PUT", body: JSON.stringify(data) }),
  changePassword: (data: any) => request("/api/settings/password", { method: "POST", body: JSON.stringify(data) }),
  getBackups: () => request("/api/settings/backup/list"),
  exportBackup: () => request("/api/settings/backup/export", { method: "POST" }),

  // Product export
  exportProducts: () => request("/api/reports/products/export"),

  // Data transfer
  importProducts: async (csvText: string) => {
    const blob = new Blob([csvText], { type: "text/csv" });
    const file = new File([blob], "products.csv");
    const formData = new FormData();
    formData.append("file", file);
    const token = (() => {
      try {
        const raw = localStorage.getItem("storetrack-session");
        if (raw) return JSON.parse(raw)._token;
      } catch { /* ignore */ }
      return null;
    })();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/api/data/import/products`, { method: "POST", headers, body: formData });
    if (!res.ok) throw new Error("Import failed");
    return res.json();
  },
};
