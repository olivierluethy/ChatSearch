(function () {
  const CONTAINER_ID = "custom-ai-box";

  // SVG icon for user
  const userIcon = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#555"/>
    </svg>
  `;

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
          <button id="new-thread-btn"> New Chat </button>
          <button id="report-bug-btn" class="link-btn">🐞 Report Bug</button>
          <button id="get-help-btn" class="link-btn">❓ Get Help</button>
          <button id="privacy-policy-btn" class="link-btn">🔐 Privacy Policy</button>
        </div>

        <!-- Main Content Area -->
        <div style="flex: 1; padding: 20px;">
          <h2 style="margin-top: 0;">Talk to AI</h2>
          <div id="chat-display" style="
            margin-top: 20px;
            max-height: 300px;
            overflow-y: auto;
            padding-right: 10px;
            display: flex;
            flex-direction: column;
            gap: 10px;
          "></div>
          <input id="custom-ai-input" value="${googleSearchInput ? googleSearchInput.value : ""}" type="text" placeholder="Type your message here..." style="
            width: 100%;
            padding: 12px;
            font-size: 16px;
            border: 1px solid #ccc;
            border-radius: 6px;
            box-sizing: border-box;
            margin-top: 10px;
          " />
        </div>
      </div>
    `;

    targetDiv.insertBefore(uiContainer, targetDiv.firstChild);

    // Function to add new thread
    document.getElementById("new-thread-btn").addEventListener("click", function () {
  chrome.storage.local.get({ threads: [] }, function (result) {
    const threads = result.threads;
    
    const id = "thread_" + Date.now(); // Eindeutige Thread-ID
    const newThread = {
      id,
      name: `Thread ${threads.length + 1}`, // Optionaler Name
      created: Date.now(),
      isActive: "no",
      messages: [], // Später werden hier Chat-IDs gespeichert
    };

    threads.push(newThread);

    chrome.storage.local.set({ threads: threads }, function () {
      console.log("Neuer Thread erstellt:", newThread);
      // Hier kannst du bei Bedarf die UI aktualisieren
    });
  });
});


    // Function to render chat messages as bubbles
    function renderChatMessages() {
      chrome.storage.local.get({ chats: [] }, function (result) {
        const chatDisplay = document.getElementById("chat-display");
        chatDisplay.innerHTML = ""; // Clear existing content

        const userChats = result.chats.filter((chat) => chat.role === "user");

        userChats.forEach((chat) => {
          const messageElement = document.createElement("div");
          messageElement.style.display = "flex";
          messageElement.style.alignItems = "flex-start";
          messageElement.style.justifyContent = "flex-end";
          messageElement.style.marginBottom = "10px";

          const bubbleContainer = document.createElement("div");
          bubbleContainer.style.maxWidth = "70%";
          bubbleContainer.style.display = "flex";
          bubbleContainer.style.flexDirection = "column";
          bubbleContainer.style.alignItems = "flex-end";

          const messageBubble = document.createElement("div");
          messageBubble.style.backgroundColor = "#007bff";
          messageBubble.style.color = "white";
          messageBubble.style.padding = "10px 15px";
          messageBubble.style.borderRadius = "15px 15px 0 15px";
          messageBubble.style.wordBreak = "break-word";
          messageBubble.textContent = chat.text;

          const timestamp = document.createElement("div");
          timestamp.style.fontSize = "12px";
          timestamp.style.color = "#555";
          timestamp.style.marginTop = "5px";
          timestamp.textContent = new Date(chat.date).toLocaleString();

          const iconContainer = document.createElement("div");
          iconContainer.style.marginLeft = "10px";
          iconContainer.innerHTML = userIcon;

          bubbleContainer.appendChild(messageBubble);
          bubbleContainer.appendChild(timestamp);
          messageElement.appendChild(bubbleContainer);
          messageElement.appendChild(iconContainer);
          chatDisplay.appendChild(messageElement);
        });

        // Auto-scroll to the latest message
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
      });
    }

    // Initial render of chat messages
    renderChatMessages();

    const customAIInput = document.getElementById("custom-ai-input");

    // Auto-save on reload if input is pre-filled
    if (customAIInput.value.trim()) {
      const inputText = customAIInput.value.trim();
      const timestamp = new Date().toISOString();

      chrome.storage.local.get({ chats: [] }, function (result) {
        const chats = result.chats;

        // Letzte 2 bis 5 User-Nachrichten holen
        const recentUserMessages = chats
          .slice(-5) // Letzte 5 Nachrichten
          .filter((entry) => entry.role === "user") // Nur User-Nachrichten
          .slice(-5); // Nochmals auf die letzten 5 beschränken, falls Filter weniger ergibt

        // Prüfen, ob inputText bereits in den letzten User-Nachrichten enthalten ist
        const isDuplicate = recentUserMessages.some(
          (entry) => entry.text === inputText,
        );

        if (!isDuplicate) {
          chats.push({
            text: inputText,
            date: timestamp,
            role: "user",
            threadId: "",
          });

          chrome.storage.local.set({ chats: chats }, function () {
            console.log("Auto-saved input after reload:", inputText);
            renderChatMessages(); // Re-render after saving
          });
        } else {
          console.log(
            "Duplikat in den letzten 2–5 Eingaben erkannt – Eingabe wurde nicht gespeichert:",
            inputText,
          );
        }

        customAIInput.value = ""; // Eingabefeld leeren
      });
    }

    // Handle Enter key to save and display new messages
    customAIInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        const inputText = customAIInput.value.trim();
        if (!inputText) return;

        const timestamp = new Date().toISOString();

        chrome.storage.local.get({ chats: [] }, function (result) {
          const chats = result.chats;
          chats.push({
            text: inputText,
            date: timestamp,
            role: "user",
            threadId: "",
          });

          chrome.storage.local.set({ chats: chats }, function () {
            console.log("Eingabe gespeichert:", inputText);
            renderChatMessages(); // Re-render after saving
          });
        });

        customAIInput.value = "";
      }
    });

    // Other button event listeners (Report Bug, Get Help, Privacy Policy) remain unchanged
    // ... (omitted for brevity, as they are not relevant to the display feature)
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
