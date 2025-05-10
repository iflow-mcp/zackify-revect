chrome.runtime.onMessage.addListener(async (message: any) => {
  if (message.type === "sendContent") {
    // take this from extension storage and have input field in settings for it
    const res = await fetch(`http://localhost:3000/index`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: message.data.text,
        external_id: message.data.url,
      }),
    });

    console.log(await res.json());
  }
});
