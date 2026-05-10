const STORAGE_KEY = 'finflow-workspace-state';

export function loadWorkspaceState(fallbackState) {
  if (typeof window === 'undefined') return fallbackState;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallbackState;

    const parsed = JSON.parse(raw);
    return {
      ...fallbackState,
      ...parsed,
    };
  } catch {
    return fallbackState;
  }
}

export function saveWorkspaceState(state) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota / serialization failures.
  }
}

export function clearWorkspaceState() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}