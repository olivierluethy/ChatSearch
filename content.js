(function () {
  const CONTAINER_ID = "custom-ai-box";
  const STORAGE_KEY = "aiSidebarWidth";
  const CHAT_FEED_ID = "chat-feed";

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
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      background-color: #ffffff;
      min-height: 500px;
      max-height: 80vh;
    `;

    // Sidebar
    const sidebar = createSidebar(sidebarWidth);
    const resizer = createResizer(sidebar);
    const mainContent = createMainContent();

    // Append components
    uiContainer.append(sidebar, resizer, mainContent);
    targetDiv.insertBefore(uiContainer, targetDiv.firstChild);

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
        <li style="padding: 12px; cursor: pointer; border-radius: 8px; transition: background 0.2s;" class="model-item active">🔹 GPT-4</li>
        <li style="padding: 12px; cursor: pointer; border-radius: 8px; transition: background 0.2s;" class="model-item">🔸 Claude 2</li>
        <li style="padding: 12px; cursor: pointer; border-radius: 8px; transition: background 0.2s;" class="model-item">🟢 Gemini</li>
        <li style="padding: 12px; cursor: pointer; border-radius: 8px; transition: background 0.2s;" class="model-item">⚙️ Custom Model</li>
      </ul>
    `;

    // Model selection logic
    sidebar.querySelectorAll(".model-item").forEach((item) => {
      item.addEventListener("click", () => {
        sidebar.querySelectorAll(".model-item").forEach((i) => i.classList.remove("active"));
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
    resizer.addEventListener("mouseover", () => (resizer.style.backgroundColor = "#c0c0c0"));
    resizer.addEventListener("mouseout", () => (resizer.style.backgroundColor = "#e0e0e0"));

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

  // Initialize chat functionality
  function initializeChat(mainContent, googleSearchInput) {
    const input = mainContent.querySelector("input");
    const sendButton = mainContent.querySelector("button");
    const chatFeed = mainContent.querySelector(`#${CHAT_FEED_ID}`);

    // Handle message submission
    function handleMessageSubmission(message) {
      if (!message) return;

      // Add user message
      addMessage(chatFeed, message, "user");
      // Add placeholder AI response
      setTimeout(() => addMessage(chatFeed, "Hello World", "ai"), 500);
      input.value = "";
      input.focus();
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

    // Style input and button interactions
    input.addEventListener("focus", () => (input.style.borderColor = "#25D366"));
    input.addEventListener("blur", () => (input.style.borderColor = "#ccc"));
    sendButton.addEventListener("mouseover", () => (sendButton.style.backgroundColor = "#20b058"));
    sendButton.addEventListener("mouseout", () => (sendButton.style.backgroundColor = "#25D366"));
  }

  // Add message to chat feed
  function addMessage(chatFeed, text, sender) {
    const messageDiv = document.createElement("div");
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    messageDiv.style.cssText = `
      max-width: 70%;
      padding: 10px 15px;
      border-radius: 12px;
      margin: 5px ${sender === "user" ? "auto 10px auto auto" : "10px auto auto 10px"};
      background-color: ${sender === "user" ? "#DCF8C6" : "#ffffff"};
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      position: relative;
      font-size: 1rem;
      line-height: 1.4;
      word-wrap: break-word;
    `;
    messageDiv.innerHTML = `
      <span style="color: black;">${text}</span>
      <div style="font-size: 0.75rem; color: #666; margin-top: 5px; text-align: ${sender === "user" ? "right" : "left"};">
        ${timestamp}
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
    if (targetDiv && !document.getElementById(CONTAINER_ID)) createUI(targetDiv);
  });

  window.addEventListener("load", () => {
    const body = document.body;
    if (body) {
      observer.observe(body, { childList: true, subtree: true });
      init();
    }
  });
})();