import { StorageKey } from './storageKeys';

/**
 * Unified Local Storage Utility
 * Provides type-safe methods for interacting with localStorage.
 */
export const storage = {
  /**
   * Retrieve data from localStorage
   */
  getData: <T>(key: StorageKey): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`[Storage] Error reading key "${key}":`, error);
      return null;
    }
  },
  
  /**
   * Save data to localStorage
   */
  setData: <T>(key: StorageKey, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`[Storage] Error writing key "${key}":`, error);
    }
  },

  /**
   * Remove a specific key from localStorage
   */
  removeData: (key: StorageKey): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`[Storage] Error removing key "${key}":`, error);
    }
  },

  /**
   * Update existing data in localStorage (partial update for objects)
   */
  updateData: <T extends object>(key: StorageKey, update: Partial<T>): void => {
    try {
      const current = storage.getData<T>(key);
      if (current) {
        storage.setData(key, { ...current, ...update });
      }
    } catch (error) {
      console.error(`[Storage] Error updating key "${key}":`, error);
    }
  },

  /**
   * Clear all application-related storage
   */
  clearAll: (): void => {
    try {
      Object.values(localStorage).forEach((_, index) => {
        const key = localStorage.key(index);
        if (key?.startsWith('careerflow_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('[Storage] Error clearing storage:', error);
    }
  }
};
