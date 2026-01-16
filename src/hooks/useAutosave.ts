import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAutosaveOptions<T> {
  data: T;
  storageKey: string;
  timestampKey: string;
  dismissedKey?: string;
  interval?: number;
  enabled?: boolean;
  onRestore?: (data: T) => void;
}

interface UseAutosaveReturn<T> {
  lastSaved: Date | null;
  isSaving: boolean;
  hasDraft: boolean;
  draftTimestamp: Date | null;
  restoreDraft: () => T | null;
  clearDraft: () => void;
  dismissDraft: () => void;
  saveDraft: () => void;
}

export function useAutosave<T>({
  data,
  storageKey,
  timestampKey,
  dismissedKey,
  interval = 30000,
  enabled = true
}: UseAutosaveOptions<T>): UseAutosaveReturn<T> {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef(data);

  // Keep dataRef in sync
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Check for existing draft on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(storageKey);
      const savedTimestamp = localStorage.getItem(timestampKey);
      const dismissedTimestamp = dismissedKey ? localStorage.getItem(dismissedKey) : null;
      
      if (savedDraft && savedTimestamp) {
        const draftTime = new Date(savedTimestamp);
        
        // Check if draft was dismissed
        if (dismissedTimestamp) {
          const dismissedTime = new Date(dismissedTimestamp);
          // Only show draft if it's newer than when it was dismissed
          if (draftTime > dismissedTime) {
            setHasDraft(true);
            setDraftTimestamp(draftTime);
          } else {
            // Draft was dismissed and no new changes - don't show dialog
            setHasDraft(false);
          }
        } else {
          // No dismissal record - show draft normally
          setHasDraft(true);
          setDraftTimestamp(draftTime);
        }
      }
    } catch (error) {
      console.error('Error checking for draft:', error);
    }
  }, [storageKey, timestampKey, dismissedKey]);

  // Save draft to localStorage
  const saveDraft = useCallback(() => {
    if (!enabled) return;
    
    setIsSaving(true);
    try {
      const now = new Date();
      localStorage.setItem(storageKey, JSON.stringify(dataRef.current));
      localStorage.setItem(timestampKey, now.toISOString());
      setLastSaved(now);
      setHasDraft(true);
      setDraftTimestamp(now);
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      // Small delay to show saving indicator
      setTimeout(() => setIsSaving(false), 300);
    }
  }, [enabled, storageKey, timestampKey]);

  // Restore draft from localStorage
  const restoreDraft = useCallback((): T | null => {
    try {
      const savedDraft = localStorage.getItem(storageKey);
      if (savedDraft) {
        return JSON.parse(savedDraft) as T;
      }
    } catch (error) {
      console.error('Error restoring draft:', error);
    }
    return null;
  }, [storageKey]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(timestampKey);
      if (dismissedKey) {
        localStorage.removeItem(dismissedKey);
      }
      setHasDraft(false);
      setDraftTimestamp(null);
      setLastSaved(null);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  }, [storageKey, timestampKey, dismissedKey]);

  // Dismiss draft - marks it as dismissed so dialog won't show again
  const dismissDraft = useCallback(() => {
    try {
      // Store the dismissal timestamp
      if (dismissedKey) {
        localStorage.setItem(dismissedKey, new Date().toISOString());
      }
      // Also clear the draft data
      localStorage.removeItem(storageKey);
      localStorage.removeItem(timestampKey);
      setHasDraft(false);
      setDraftTimestamp(null);
      setLastSaved(null);
    } catch (error) {
      console.error('Error dismissing draft:', error);
    }
  }, [storageKey, timestampKey, dismissedKey]);

  // Set up auto-save interval
  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(() => {
      saveDraft();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, saveDraft]);

  // Save on page unload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      saveDraft();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, saveDraft]);

  return {
    lastSaved,
    isSaving,
    hasDraft,
    draftTimestamp,
    restoreDraft,
    clearDraft,
    dismissDraft,
    saveDraft
  };
}
