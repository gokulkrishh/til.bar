const BASE_URL = "https://til.bar";
const API_URL = `${BASE_URL}/api/save`;
const API_KEY_STORAGE = "api_key";

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
  await handleSave(tab.url, tab.id);
});

if (chrome.contextMenus) {
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== "save-to-tilbar") return;
    const url = info.linkUrl || info.pageUrl;
    if (!url) return;
    await handleSave(url, tab?.id);
  });
}

async function handleSave(url, tabId) {
  try {
    const apiKey = await getApiKey();

    if (!apiKey) {
      chrome.runtime.openOptionsPage();
      return;
    }

    // Save in background
    const result = await saveLink(url, apiKey);

    if (!result.success) {
      showToast(tabId, "Failed to save", "error");
    } else {
      // Optimistic — show success immediately
      playSound();
      showToast(tabId, "Saved", "success");
    }
  } catch (err) {
    console.error("[til.bar] Error:", err);
    showToast(tabId, "Failed to save", "error");
  }
}

// --- API Key management ---

async function getApiKey() {
  const { [API_KEY_STORAGE]: apiKey } =
    await chrome.storage.local.get(API_KEY_STORAGE);
  return apiKey || null;
}

// --- Save link ---

async function saveLink(url, apiKey) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ url }),
    });

    if (response.ok) {
      return { success: true };
    }

    if (response.status === 401) {
      console.error(
        "[til.bar] Invalid API key. Check your key in extension options.",
      );
      return { success: false, error: "unauthorized" };
    }

    return { success: false, error: "Failed to save" };
  } catch (err) {
    console.error("[til.bar] Save error:", err);
    return { success: false, error: err.message };
  }
}

function showToast(tabId, message, type) {
  if (!tabId) return;
  chrome.scripting
    .executeScript({
      target: { tabId },
      func: (msg, t) => {
        const existing = document.getElementById("tilbar-toast");
        if (existing) existing.remove();

        const toast = document.createElement("div");
        toast.id = "tilbar-toast";

        const icon = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg",
        );
        icon.setAttribute("viewBox", "0 0 24 24");
        icon.setAttribute("fill", "none");
        icon.setAttribute("stroke", "currentColor");
        icon.setAttribute("stroke-width", "2");
        icon.setAttribute("stroke-linecap", "round");
        icon.setAttribute("stroke-linejoin", "round");
        Object.assign(icon.style, {
          width: "1rem",
          height: "1rem",
          flexShrink: "0",
          color: t === "success" ? "#22c55e" : "#fff",
        });
        icon.innerHTML =
          t === "success"
            ? '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'
            : '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>';
        toast.appendChild(icon);

        const text = document.createElement("span");
        text.textContent = msg;
        toast.appendChild(text);

        Object.assign(toast.style, {
          position: "fixed",
          top: "1.5rem",
          right: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          padding: "0.5rem 0.625rem",
          borderRadius: "10rem",
          flexShrink: "0",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: "0.8125rem",
          fontWeight: "500",
          color: "#fff",
          background: t === "success" ? "#171717" : "#dc2626",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: "2147483647",
          opacity: "0",
          transform: "translateY(0.5rem)",
          transition: "opacity 0.2s, transform 0.2s",
        });

        document.body.appendChild(toast);
        requestAnimationFrame(() => {
          toast.style.opacity = "1";
          toast.style.transform = "translateY(0)";
        });

        setTimeout(() => {
          toast.style.opacity = "0";
          toast.style.transform = "translateY(0.5rem)";
          setTimeout(() => toast.remove(), 3000);
        }, 4000);
      },
      args: [message, type],
    })
    .catch(() => {});
}

async function ensureOffscreen() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
  });
  if (contexts.length > 0) return;
  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["AUDIO_PLAYBACK"],
    justification: "Play sound on save",
  });
}

async function playSound() {
  try {
    await ensureOffscreen();
    chrome.runtime.sendMessage({
      type: "play-sound",
      url: chrome.runtime.getURL("sounds/success.mp3"),
    });
  } catch {
    // Silently fail if offscreen isn't supported
  }
}
