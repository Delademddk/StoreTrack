import { useSyncExternalStore } from "react";

import { categories as seedCategories } from "@/lib/mock-data";

/**
 * Category record. Kept intentionally minimal — only `name` is required today.
 * Optional fields (color, icon, description) are declared so a future category
 * management page can populate them without changing consumers or the store
 * shape. Products still reference categories by `name` for backwards
 * compatibility with existing mock data.
 */
export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  description?: string;
  createdAt: string;
}

const nowIso = () => new Date().toISOString();

let categories: Category[] = seedCategories.map((name, i) => ({
  id: `c_seed_${i}`,
  name,
  createdAt: nowIso(),
}));

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const categoriesStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return categories;
  },
  add(name: string): Category | null {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const existing = categories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;
    const created: Category = {
      id: `c_${Date.now()}`,
      name: trimmed,
      createdAt: nowIso(),
    };
    categories = [...categories, created];
    emit();
    return created;
  },
  exportAll() {
    return [...categories];
  },
  restoreAll(next: Category[]) {
    categories = [...next];
    emit();
  },
};

export function useCategories(): Category[] {
  return useSyncExternalStore(
    categoriesStore.subscribe,
    categoriesStore.getSnapshot,
    categoriesStore.getSnapshot,
  );
}
