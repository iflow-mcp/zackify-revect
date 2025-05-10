// Function to send content to background
const sendContent = () => {
  setTimeout(() => {
    console.log("sending");
    chrome.runtime.sendMessage({
      type: "sendContent",
      data: {
        url: window.location.href,
        text: document.body.innerText,
      },
    });
  }, 3000); // 1000ms delay
};

// Keep track of last URL to avoid duplicate sends
let lastUrl = location.href;

// Create observer to monitor URL changes
const urlObserver = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    sendContent();
  }
});

// Run on initial page load
addEventListener("load", () => {
  sendContent();
  // Start observing the document for URL changes
  urlObserver.observe(document, { subtree: true, childList: true });
});
