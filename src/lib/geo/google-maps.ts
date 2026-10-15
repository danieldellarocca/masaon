// טעינת Google Maps JavaScript API עם מפתח של המשתמש.

const KEY_STORAGE = "geo_maps_api_key";

export const ENV_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
// AdvancedMarkerElement דורש Map ID; DEMO_MAP_ID עובד עם כל מפתח.
export const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}

export function storeApiKey(key: string) {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key);
    else localStorage.removeItem(KEY_STORAGE);
  } catch {
    // אין גישה ל-localStorage (גלישה פרטית וכו׳) – המפתח יישמר רק לסשן הנוכחי
  }
}

export function resolveApiKey(): string {
  return getStoredApiKey() || ENV_API_KEY;
}

type AuthListener = () => void;
const authListeners = new Set<AuthListener>();
let authFailed = false;

// גוגל קוראת ל-window.gm_authFailure כשהמפתח לא תקין או לא מורשה לכתובת האתר.
export function onAuthFailure(listener: AuthListener): () => void {
  if (authFailed) listener();
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

let loadedKey: string | null = null;
let loading: Promise<void> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (loadedKey && loadedKey !== apiKey) {
    // אי אפשר לטעון את הספרייה פעמיים עם מפתחות שונים – צריך רענון לדף.
    return Promise.reject(new Error("KEY_CHANGED"));
  }
  if (loading) return loading;

  loadedKey = apiKey;
  loading = new Promise<void>((resolve, reject) => {
    const w = window as unknown as Record<string, unknown>;
    w.gm_authFailure = () => {
      authFailed = true;
      authListeners.forEach((l) => l());
    };
    const callbackName = "__geoMapsReady";
    w[callbackName] = () => resolve();

    const params = new URLSearchParams({
      key: apiKey,
      v: "weekly",
      language: "he",
      loading: "async",
      callback: callbackName,
    });
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    script.async = true;
    script.onerror = () => {
      loading = null;
      loadedKey = null;
      script.remove();
      reject(new Error("לא הצלחנו לטעון את Google Maps. בדקו את החיבור לאינטרנט."));
    };
    document.head.appendChild(script);
  }).then(async () => {
    await Promise.all([
      google.maps.importLibrary("maps"),
      google.maps.importLibrary("streetView"),
      google.maps.importLibrary("marker"),
    ]);
  });
  return loading;
}
