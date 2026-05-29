import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
  type Dispatch,
} from 'react';
import type { QRConfig } from '../qr/types';
import { configReducer, DEFAULT_CONFIG, type ConfigAction } from './configReducer';

const STORAGE_KEY = 'qrsg.config.v1';

const ConfigStateContext = createContext<QRConfig | null>(null);
const ConfigDispatchContext = createContext<Dispatch<ConfigAction> | null>(null);

function loadInitial(): QRConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<QRConfig>;
    // Merge over defaults (tolerates schema growth). Logos are session-only - never persisted.
    return { ...DEFAULT_CONFIG, ...parsed, logo: null };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(configReducer, undefined, loadInitial);

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const persistable: Partial<QRConfig> = { ...state, logo: null };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
      } catch {
        /* quota / private mode - non-fatal */
      }
    }, 400);
    return () => clearTimeout(id);
  }, [state]);

  return (
    <ConfigStateContext.Provider value={state}>
      <ConfigDispatchContext.Provider value={dispatch}>{children}</ConfigDispatchContext.Provider>
    </ConfigStateContext.Provider>
  );
}

export function useConfig(): QRConfig {
  const ctx = useContext(ConfigStateContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
}

export function useConfigDispatch(): Dispatch<ConfigAction> {
  const ctx = useContext(ConfigDispatchContext);
  if (!ctx) throw new Error('useConfigDispatch must be used within ConfigProvider');
  return ctx;
}
