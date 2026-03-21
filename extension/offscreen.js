chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "play-sound" && message.url) {
    const audio = new Audio(message.url);
    audio.play().catch(() => {});
  }
});
