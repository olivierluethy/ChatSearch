(function () {
  const CONTAINER_ID = "custom-ai-box";

  function createUI(targetDiv) {
    // Prevent duplicate injection
    if (document.getElementById(CONTAINER_ID)) return;

    const googleSearchInput = document.querySelector("textarea");

    const uiContainer = document.createElement("div");
    uiContainer.id = CONTAINER_ID;
    uiContainer.innerHTML = `
      <div style="
        display: flex;
        width: 80%;
        margin: 2em auto;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        font-family: 'Segoe UI', sans-serif;
        overflow: hidden;
        background-color: #fff;
        color: black;
        min-height: 300px;
      ">
        <!-- Sidebar Navigation -->
        <div style="
          background-color: #f4f4f4;
          padding: 20px;
          width: 200px;
          border-right: 1px solid #ddd;
        ">
          <h3 style="margin-top: 0; font-size: 18px;">Chat Threads</h3>
          <ul id='threads' style="list-style: none; padding: 0; margin: 0;"></ul>

          <button id="report-bug-btn" class="link-btn">🐞 Report Bug</button>
          <button id="get-help-btn" class="link-btn">❓ Get Help</button>
          <button id="privacy-policy-btn" class="link-btn">🔐 Privacy Policy</button>
        </div>

        <!-- Main Content Area -->
        <div style="flex: 1; padding: 20px;">
          <h2 style="margin-top: 0;">Talk to AI</h2>
          <input id="custom-ai-input" value="${googleSearchInput ? googleSearchInput.value : ""}" type="text" placeholder="Type your message here..." style="
            width: 100%;
            padding: 12px;
            font-size: 16px;
            border: 1px solid #ccc;
            border-radius: 6px;
            box-sizing: border-box;
          " />
        </div>
      </div>
    `;

    targetDiv.insertBefore(uiContainer, targetDiv.firstChild);

    const customAIInput = document.getElementById("custom-ai-input");

    // ✅ AUTO-SAVE on reload if input is pre-filled
    if (customAIInput.value.trim()) {
      const inputText = customAIInput.value.trim();
      const timestamp = new Date().toISOString();

      chrome.storage.local.get({ chats: [] }, function (result) {
        const chats = result.chats;

        chats.push({
          text: inputText,
          date: timestamp,
        });

        chrome.storage.local.set({ chats: chats }, function () {
          console.log("Auto-saved input after reload:", inputText);
          console.log("Gespeicherter Verlauf:", result.chats);
        });
      });

      customAIInput.value = ""; // clear input after saving
    }

    customAIInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault(); // prevents newline

        const inputText = customAIInput.value.trim();
        if (!inputText) return; // ignore empty inputs

        const timestamp = new Date().toISOString(); // exact date + time

        chrome.storage.local.get({ chats: [] }, function (result) {
          const chats = result.chats;

          chats.push({
            text: inputText,
            date: timestamp,
          });

          chrome.storage.local.set({ chats: chats }, function () {
            console.log("Eingabe gespeichert:", inputText);
            console.log("Gespeicherter Verlauf:", result.chats);
          });
        });

        customAIInput.value = "";

        chrome.storage.local.get({ chats: [] }, function (result) {
          console.log("Gespeicherter Verlauf:", result.chats);
        });
      }
    });

    // Report Bug | Get Help | Privacy Policy
    const reportBtn = document.getElementById("report-bug-btn");

    reportBtn.addEventListener("click", function () {
      window.open(
        "https://docs.google.com/forms/d/e/1FAIpQLScSfquZW5idQXGsCHXc-OlMaa97eh_1i9BnmMf7Ea9HVSFQzg/viewform?usp=sharing&ouid=107403711423930702162",
        "_blank",
      );
    });

    const getHelpBtn = document.getElementById("get-help-btn");
    getHelpBtn.addEventListener("click", function () {
      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100vw";
      overlay.style.height = "100vh";
      overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.zIndex = "1000";

      const modal = document.createElement("div");
      modal.style.backgroundColor = "#fff";
      modal.style.padding = "20px";
      modal.style.borderRadius = "8px";
      modal.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.3)";
      modal.style.maxWidth = "400px";
      modal.style.textAlign = "center";
      modal.style.fontFamily = "sans-serif";
      modal.style.color = "black";

      const title = document.createElement("h2");
      title.textContent = "How we can help";
      const message = document.createElement("p");
      message.innerHTML = `
        <strong>Welcome to your AI-powered Sidebar!</strong><br/><br/>
        Here's how this tool can help you be more productive every day:
        <ul style="text-align:left; margin:1em 0; padding-left: 1em;">
          <li><strong>🔍 Google Integration:</strong> Just type something into Google – the AI will detect your query and instantly provide a helpful answer.</li>
          <li><strong>💬 Chat History:</strong> All your conversations are saved in threads, so you can return to them anytime or continue where you left off.</li>
          <li><strong>🧠 Context Awareness:</strong> The AI remembers the conversation context per thread. The longer the thread, the smarter the answers.</li>
          <li><strong>✏️ Rename & 🗑 Delete:</strong> Organize your chats with custom titles – or remove old threads when you no longer need them.</li>
          <li><strong>📌 Autoscroll & Scroll Button:</strong> Never miss a new message – or jump to the latest response with a single click.</li>
        </ul>
        <p style="font-size:14px; color:#555;">
          👉 Tip: Use this sidebar daily to get quick answers, make better decisions, or brainstorm ideas – all right next to your search results.
        </p>
      `;

      const closeBtn = document.createElement("button");
      closeBtn.textContent = "Schließen";
      closeBtn.style.marginTop = "15px";
      closeBtn.style.padding = "8px 16px";
      closeBtn.style.cursor = "pointer";
      closeBtn.addEventListener("click", function () {
        document.body.removeChild(overlay);
      });

      modal.appendChild(title);
      modal.appendChild(message);
      modal.appendChild(closeBtn);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
    });

    const getPPBtn = document.getElementById("privacy-policy-btn");

    getPPBtn.addEventListener("click", function () {
      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100vw";
      overlay.style.height = "100vh";
      overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.zIndex = "1000";

      const modal = document.createElement("div");
      modal.style.backgroundColor = "#fff";
      modal.style.padding = "20px";
      modal.style.borderRadius = "8px";
      modal.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.3)";
      modal.style.maxWidth = "500px";
      modal.style.textAlign = "left";
      modal.style.fontFamily = "sans-serif";
      modal.style.color = "black";
      modal.style.maxHeight = "80vh";
      modal.style.overflowY = "auto";

      const title = document.createElement("h2");
      title.textContent = "Privacy Policy";

      const message = document.createElement("div");
      message.innerHTML = `
        <p>
          Your privacy is important to us. This tool stores your chat threads locally in your browser using Chrome's extension storage.
        </p>
        <ul style="margin:1em 0; padding-left: 1.2em;">
          <li><strong>📁 Local Storage:</strong> All messages and threads are saved only on your device. We do not collect or transmit personal data.</li>
          <li><strong>🔐 No Tracking:</strong> This extension does not include analytics, trackers, or ads.</li>
          <li><strong>🧠 Context Handling:</strong> Your messages are used solely to provide better contextual responses. They are not shared.</li>
          <li><strong>📤 API Requests:</strong> Messages are sent to your self-hosted API endpoint, if configured. Ensure it complies with your privacy requirements.</li>
          <li><strong>🗑 Easy Data Removal:</strong> You can clear all stored data anytime via the "Clear All" button.</li>
        </ul>
        <p style="font-size:14px; color:#555;">
          By using this extension, you agree to local-only data handling and understand that your privacy is protected by design.
        </p>
      `;

      const closeBtn = document.createElement("button");
      closeBtn.textContent = "Close";
      closeBtn.style.marginTop = "15px";
      closeBtn.style.padding = "8px 16px";
      closeBtn.style.cursor = "pointer";

      closeBtn.addEventListener("click", function () {
        document.body.removeChild(overlay);
      });

      modal.appendChild(title);
      modal.appendChild(message);
      modal.appendChild(closeBtn);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
    });
  }

  function init() {
    const targetDiv = document.getElementById("appbar");
    if (targetDiv) {
      createUI(targetDiv);
    }
  }

  const observer = new MutationObserver(() => {
    const targetDiv = document.getElementById("appbar");
    if (targetDiv && !document.getElementById(CONTAINER_ID)) {
      createUI(targetDiv);
    }
  });

  window.addEventListener("load", () => {
    const body = document.body;
    if (body) {
      observer.observe(body, {
        childList: true,
        subtree: true,
      });

      init();
    }
  });
})();
