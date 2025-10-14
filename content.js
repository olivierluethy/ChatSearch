(function () {
  const CONTAINER_ID = "custom-ai-box";
  const STORAGE_KEY = "aiSidebarWidth";
  const CHAT_FEED_ID = "chat-feed";
  const CHAT_HISTORY_KEY = "chatHistory";

  // Create and manage the UI
  function createUI(targetDiv) {
    if (document.getElementById(CONTAINER_ID)) return;

    const savedWidth = localStorage.getItem(STORAGE_KEY);
    const sidebarWidth = savedWidth ? parseInt(savedWidth, 10) : 250;

    // Get textarea value for automatic submission
    const googleSearchInput = document.querySelector("textarea");

    // Main container
    const uiContainer = document.createElement("div");
    uiContainer.id = CONTAINER_ID;
    uiContainer.style.cssText = `
      display: flex;
      width: 80%;
      max-width: 1200px;
      margin: 2em auto;
      border-radius: 16px;
      box-shadow: 0px 0px 36px 0px rgba(255,255,255,0.6);
      -webkit-box-shadow: 0px 0px 36px 0px rgba(255,255,255,0.6);
      -moz-box-shadow: 0px 0px 36px 0px rgba(255,255,255,0.6);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      background-color: #ffffff;
    `;

    // Sidebar
    const sidebar = createSidebar(sidebarWidth);
    const resizer = createResizer(sidebar);
    const mainContent = createMainContent();

    // Append components
    uiContainer.append(sidebar, resizer, mainContent);
    targetDiv.insertBefore(uiContainer, targetDiv.firstChild);

    // Toggle Button (minimize / maximize)
    const toggleButton = document.createElement("button");
    toggleButton.innerText = "🔽";
    toggleButton.title = "Minimize/Maximize";
    toggleButton.style.cssText = `
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  transition: transform 0.3s;
`;

    let isMinimized = false;
    let originalWidth = uiContainer.style.width;
    let originalHeight = uiContainer.style.height;
    let originalMargin = uiContainer.style.margin;

    toggleButton.addEventListener("click", () => {
      if (!isMinimized) {
        // Save current size before minimizing
        originalWidth = uiContainer.style.width;
        originalHeight = uiContainer.style.height;
        originalMargin = uiContainer.style.margin;

        uiContainer.style.width = "60%";
        uiContainer.style.height = "40vh";
        uiContainer.style.margin = "2rem";
        toggleButton.innerText = "🔼";
      } else {
        // Restore original size
        uiContainer.style.width = originalWidth;
        uiContainer.style.height = originalHeight;
        uiContainer.style.margin = originalMargin;
        toggleButton.innerText = "🔽";
      }
      isMinimized = !isMinimized;
    });

    // Container needs relative positioning for absolute button
    uiContainer.style.position = "relative";
    uiContainer.appendChild(toggleButton);

    // Initialize chat functionality
    initializeChat(mainContent, googleSearchInput);
  }

  // Create sidebar with AI model selection
  function createSidebar(sidebarWidth) {
    const sidebar = document.createElement("div");
    sidebar.style.cssText = `
      background-color: #f8f9fa;
      padding: 20px;
      width: ${sidebarWidth}px;
      min-width: 150px;
      max-width: 400px;
      border-right: 1px solid #e0e0e0;
      box-sizing: border-box;
      overflow-y: auto;
    `;
    sidebar.innerHTML = `
      <h3 style="margin: 0 0 20px; font-size: 1.2rem; font-weight: 600; color: #333;">AI Models</h3>
      <ul style="list-style: none; padding: 0; margin: 0; color: black;">
        <li style="padding: 12px; cursor: pointer; border-radius: 8px; transition: background 0.2s;" class="model-item active">🔹 GPT-4 (GPT-4o Mini)</li>
        <li style="padding: 12px; cursor: pointer; border-radius: 8px; transition: background 0.2s;" class="model-item">🟢 Gemini (Gemini 2.5 Flash-Lite)</li>
        <li style="padding: 12px; cursor: pointer; border-radius: 8px; transition: background 0.2s;" class="model-item">🟢 Grok (Grok 3 Mini)</li>
      </ul>
      <button id="clear-history" style="
        margin-top: 20px;
        padding: 10px;
        width: 100%;
        background-color: #ff4d4f;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
        transition: background 0.2s;
      ">Clear Chat History</button>
    `;

    // Model selection logic
    sidebar.querySelectorAll(".model-item").forEach((item) => {
      item.addEventListener("click", () => {
        sidebar
          .querySelectorAll(".model-item")
          .forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
        item.style.backgroundColor = "#e0e7ff";
        setTimeout(() => (item.style.backgroundColor = ""), 200);
      });
    });

    return sidebar;
  }

  // Create resizer for sidebar
  function createResizer(sidebar) {
    const resizer = document.createElement("div");
    resizer.style.cssText = `
      width: 6px;
      cursor: ew-resize;
      background-color: #e0e0e0;
      transition: background 0.2s;
    `;
    resizer.addEventListener(
      "mouseover",
      () => (resizer.style.backgroundColor = "#c0c0c0")
    );
    resizer.addEventListener(
      "mouseout",
      () => (resizer.style.backgroundColor = "#e0e0e0")
    );

    let isResizing = false;
    resizer.addEventListener("mousedown", () => {
      isResizing = true;
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isResizing) return;
      const containerLeft = sidebar.parentElement.getBoundingClientRect().left;
      let newWidth = e.clientX - containerLeft;
      newWidth = Math.max(150, Math.min(newWidth, 400));
      sidebar.style.width = `${newWidth}px`;
    });

    document.addEventListener("mouseup", () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        localStorage.setItem(STORAGE_KEY, parseInt(sidebar.style.width));
      }
    });

    return resizer;
  }

  // Create main content area with chat feed and input
  function createMainContent() {
    const mainContent = document.createElement("div");
    mainContent.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 20px;
      box-sizing: border-box;
      background-color: #ece5dd;
    `;
    mainContent.innerHTML = `
      <h2 style="margin: 0 0 20px; font-size: 1.5rem; font-weight: 600; color: #333;">Talk to AI</h2>
      <div id="${CHAT_FEED_ID}" style="
        flex: 1;
        overflow-y: auto;
        margin-bottom: 20px;
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        scroll-behavior: smooth;
        max-height: min(400px, 50vh);
      "></div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <input type="text" placeholder="Type your message here..." style="
          flex: 1;
          padding: 12px;
          font-size: 1rem;
          border: 1px solid #ccc;
          border-radius: 20px;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.2s;
        " />
        <button style="
          padding: 12px 20px;
          background-color: #25D366;
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-size: 1rem;
          transition: background 0.2s;
        ">Send</button>
      </div>
    `;
    return mainContent;
  }

  // Load chat history from chrome.storage.local
  function loadChatHistory(chatFeed) {
    chrome.storage.local.get([CHAT_HISTORY_KEY], (result) => {
      const messages = result[CHAT_HISTORY_KEY] || [];
      messages.forEach((msg) =>
        addMessage(chatFeed, msg.text, msg.sender, msg.timestamp)
      );
    });
  }

  // Save a message to chrome.storage.local
  function saveMessage(text, sender, timestamp) {
    chrome.storage.local.get([CHAT_HISTORY_KEY], (result) => {
      const messages = result[CHAT_HISTORY_KEY] || [];
      messages.push({ text, sender, timestamp });
      chrome.storage.local.set({ [CHAT_HISTORY_KEY]: messages });
    });
  }

  // Clear chat history from chrome.storage.local and chat feed
  function clearChatHistory(chatFeed) {
    chrome.storage.local.set({ [CHAT_HISTORY_KEY]: [] }, () => {
      chatFeed.innerHTML = ""; // Clear the chat feed
    });
  }

  // Initialize chat functionality
  // Initialize chat functionality
function initializeChat(mainContent, googleSearchInput) {
  const input = mainContent.querySelector("input");
  const sendButton = mainContent.querySelector("button");
  const chatFeed = mainContent.querySelector(`#${CHAT_FEED_ID}`);
  const clearHistoryButton = document.querySelector("#clear-history");

  // Load chat history
  loadChatHistory(chatFeed);

  // Handle message submission
  async function handleMessageSubmission(message) {
    if (!message) return;

    const timestamp = new Date().toISOString();
    // Add user message locally
    addMessage(chatFeed, message, "user", timestamp);
    saveMessage(message, "user", timestamp);
    input.value = "";
    input.focus();

    // Prepare payload for API call
    const payload = {
      model: "gpt-3.5-turbo",  // oder "gpt-4o-mini" wenn verfügbar
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    };

    try {
      // Call your backend API
      const res = await fetch("http://127.0.0.1:8000/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Add AI response to chat and save it
      const aiMessage = data.response || "Keine Antwort erhalten.";
      const aiTimestamp = new Date().toISOString();
      addMessage(chatFeed, aiMessage, "ai", aiTimestamp);
      saveMessage(aiMessage, "ai", aiTimestamp);

    } catch (error) {
      const errorTimestamp = new Date().toISOString();
      addMessage(chatFeed, `Error: ${error.message}`, "ai", errorTimestamp);
      saveMessage(`Error: ${error.message}`, "ai", errorTimestamp);
    }
  }

  // Auto-submit textarea value if available
  if (googleSearchInput && googleSearchInput.value.trim()) {
    handleMessageSubmission(googleSearchInput.value.trim());
  }

  // Submit on Enter key
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const message = input.value.trim();
      handleMessageSubmission(message);
    }
  });

  // Submit on Send button click
  sendButton.addEventListener("click", () => {
    const message = input.value.trim();
    handleMessageSubmission(message);
  });

  // Clear history button
  if (clearHistoryButton) {
    clearHistoryButton.addEventListener("click", () =>
      clearChatHistory(chatFeed)
    );
    clearHistoryButton.addEventListener(
      "mouseover",
      () => (clearHistoryButton.style.backgroundColor = "#e6393d")
    );
    clearHistoryButton.addEventListener(
      "mouseout",
      () => (clearHistoryButton.style.backgroundColor = "#ff4d4f")
    );
  }

  // Style input and button interactions
  input.addEventListener("focus", () => (input.style.borderColor = "#25D366"));
  input.addEventListener("blur", () => (input.style.borderColor = "#ccc"));
  sendButton.addEventListener("mouseover", () => (sendButton.style.backgroundColor = "#20b058"));
  sendButton.addEventListener("mouseout", () => (sendButton.style.backgroundColor = "#25D366"));
}


  // Add message to chat feed
  function addMessage(chatFeed, text, sender, timestamp) {
    const messageDiv = document.createElement("div");
    const displayTimestamp = new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    messageDiv.style.cssText = `
      max-width: 70%;
      padding: 10px 15px;
      border-radius: 12px;
      margin: 5px ${
        sender === "user" ? "auto 10px auto auto" : "10px auto auto 10px"
      };
      background-color: ${sender === "user" ? "#DCF8C6" : "#ffffff"};
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      position: relative;
      font-size: 1rem;
      line-height: 1.4;
      word-wrap: break-word;
    `;
    messageDiv.innerHTML = `
      <span style="color: black;">${text}</span>
      <div style="font-size: 0.75rem; color: #666; margin-top: 5px; text-align: ${
        sender === "user" ? "right" : "left"
      };">
        ${displayTimestamp}
      </div>
    `;
    chatFeed.appendChild(messageDiv);
    chatFeed.scrollTop = chatFeed.scrollHeight; // Auto-scroll to bottom
  }

  // Initialize and observe DOM
  function init() {
    const targetDiv = document.getElementById("appbar");
    if (targetDiv) createUI(targetDiv);
  }

  const observer = new MutationObserver(() => {
    const targetDiv = document.getElementById("appbar");
    if (targetDiv && !document.getElementById(CONTAINER_ID))
      createUI(targetDiv);
  });

  window.addEventListener("load", () => {
    const body = document.body;
    if (body) {
      observer.observe(body, { childList: true, subtree: true });
      init();
    }
  });
})();
