const BASE_URL = "https://til.bar";
const API_URL = `${BASE_URL}/api/save`;
const REFRESH_URL = `${BASE_URL}/api/auth/refresh`;
const CONNECT_URL = `${BASE_URL}/auth/extension/connect`;
const SESSION_KEY = "supabase_session";
const BADGE_CLEAR_MS = 2000;

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.contextMenus) {
    chrome.contextMenus.create({
      id: "save-to-tilbar",
      title: "Save to til.bar",
      contexts: ["link", "page"],
    });
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  await handleSave(tab.url, tab.id, true);
});

if (chrome.contextMenus) {
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== "save-to-tilbar") return;
    const url = info.linkUrl || info.pageUrl;
    if (!url) return;
    await handleSave(url, tab?.id, true);
  });
}

async function handleSave(url, tabId, canAuthenticate) {
  try {
    const session = await getSession();

    if (session) {
      setBadge("…", "#6B7280", tabId);
      const result = await saveLink(url, session);
      if (result.success) {
        setBadge("✓", "#22C55E", tabId);
        playSound(tabId);
      } else {
        setBadge("!", "#EF4444", tabId);
      }
    } else if (canAuthenticate) {
      const auth = await authenticate();
      if (auth.success) {
        setBadge("…", "#6B7280", tabId);
        const newSession = await getSession();
        const result = await saveLink(url, newSession);
        if (result.success) {
          setBadge("✓", "#22C55E", tabId);
          playSound(tabId);
        } else {
          setBadge("!", "#EF4444", tabId);
        }
      } else {
        setBadge("!", "#EF4444", tabId);
      }
    } else {
      setBadge("!", "#EF4444", tabId);
    }

    setTimeout(() => clearBadge(tabId), BADGE_CLEAR_MS);
  } catch (err) {
    console.error("[til.bar] Error:", err);
  }
}

// --- Session management ---

let refreshPromise = null;
let refreshBackoffUntil = 0;
const REFRESH_BACKOFF_MS = 60000;

async function getSession() {
  const { [SESSION_KEY]: session } =
    await chrome.storage.local.get(SESSION_KEY);

  if (!session) return null;

  const now = Math.floor(Date.now() / 1000);

  // Refresh if token expires within 5 minutes
  if (session.expires_at && now >= session.expires_at - 300) {
    if (Date.now() < refreshBackoffUntil) return session;

    if (!refreshPromise) {
      refreshPromise = refreshSession(session);
    }
    return refreshPromise;
  }

  return session;
}

async function clearSession() {
  await chrome.storage.local.remove([SESSION_KEY]);
}

async function refreshSession(session) {
  try {
    const response = await fetch(REFRESH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });

    if (response.ok) {
      const data = await response.json();
      const newSession = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        user: data.user || session.user,
      };
      await chrome.storage.local.set({ [SESSION_KEY]: newSession });
      return newSession;
    }

    if (response.status === 400 || response.status === 401) {
      await clearSession();
      return null;
    }

    refreshBackoffUntil = Date.now() + REFRESH_BACKOFF_MS;
    return session;
  } catch (err) {
    console.warn("[til.bar] Refresh error:", err);
    refreshBackoffUntil = Date.now() + REFRESH_BACKOFF_MS;
    return session;
  } finally {
    refreshPromise = null;
  }
}

// --- Auth flow ---

async function authenticate() {
  try {
    const redirectUrl = chrome.identity.getRedirectURL();
    const connectUrl = `${CONNECT_URL}?redirect_uri=${encodeURIComponent(redirectUrl)}&state=${chrome.runtime.id}`;

    const responseUrl = await chrome.identity.launchWebAuthFlow({
      url: connectUrl,
      interactive: true,
    });

    const hashIndex = responseUrl.indexOf("#");
    if (hashIndex === -1) {
      throw new Error("No tokens received");
    }

    const params = new URLSearchParams(responseUrl.substring(hashIndex + 1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const expiresAt = params.get("expires_at");

    if (!accessToken || !refreshToken) {
      throw new Error("Missing tokens in response");
    }

    await chrome.storage.local.set({
      [SESSION_KEY]: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt ? parseInt(expiresAt) : null,
      },
    });

    return { success: true };
  } catch (err) {
    console.error("[til.bar] Auth failed:", err);
    return { success: false, error: err.message };
  }
}

// --- Save link ---

async function saveLink(url, session) {
  try {
    const doFetch = (token) =>
      fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url }),
      });

    const response = await doFetch(session.access_token);

    if (response.ok) {
      return { success: true };
    }

    if (response.status === 401) {
      if (!refreshPromise) {
        refreshPromise = refreshSession(session);
      }
      const newSession = await refreshPromise;
      if (!newSession) {
        return { success: false, error: "unauthorized" };
      }

      const retryResponse = await doFetch(newSession.access_token);
      if (retryResponse.ok) {
        return { success: true };
      }

      await clearSession();
      return { success: false, error: "unauthorized" };
    }

    return { success: false, error: "Failed to save" };
  } catch (err) {
    console.error("[til.bar] Save error:", err);
    return { success: false, error: err.message };
  }
}

// --- Badge & Sound ---

function setBadge(text, color, tabId) {
  chrome.action.setBadgeText({ text, tabId });
  chrome.action.setBadgeBackgroundColor({ color, tabId });
}

function clearBadge(tabId) {
  chrome.action.setBadgeText({ text: "", tabId });
}

function playSound(tabId) {
  if (!tabId) return;
  const soundUrl = chrome.runtime.getURL("sounds/success.mp3");
  chrome.scripting
    .executeScript({
      target: { tabId },
      func: (url) => new Audio(url).play(),
      args: [soundUrl],
    })
    .catch(() => {});
}
