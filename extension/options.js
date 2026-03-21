const API_KEY_STORAGE = "api_key";

const input = document.getElementById("apiKey");
const saveBtn = document.getElementById("save");
const clearBtn = document.getElementById("clear");
const statusEl = document.getElementById("status");

// Load existing key
chrome.storage.local.get(API_KEY_STORAGE, ({ [API_KEY_STORAGE]: key }) => {
  if (key) {
    input.value = key;
    clearBtn.style.display = "";
  }
});

saveBtn.addEventListener("click", async () => {
  const key = input.value.trim();

  if (!key) {
    showStatus("Enter an API key", "error");
    return;
  }

  if (!key.startsWith("mcp_sk_")) {
    showStatus("Key must start with mcp_sk_", "error");
    return;
  }

  await chrome.storage.local.set({ [API_KEY_STORAGE]: key });
  clearBtn.style.display = "";
  showStatus("Saved", "success");
});

clearBtn.addEventListener("click", async () => {
  await chrome.storage.local.remove(API_KEY_STORAGE);
  input.value = "";
  clearBtn.style.display = "none";
  showStatus("Key removed", "success");
});

function showStatus(text, type) {
  statusEl.textContent = text;
  statusEl.className = `status visible ${type}`;
  setTimeout(() => {
    statusEl.className = "status";
  }, 4000);
}
