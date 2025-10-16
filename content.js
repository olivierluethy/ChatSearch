(function () {
  const CONTAINER_ID = "custom-ai-box";

  // SVG icon for user
  const userIcon = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#555"/>
    </svg>
  `;

  // SVG icon for AI
const aiIcon = `
<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="24" height="24" rx="12" fill="#E0F7FA"/>
  <path d="M12 2C12.55 2 13 2.45 13 3V4H11V3C11 2.45 11.45 2 12 2Z" fill="#607D8B"/>
  <circle cx="12" cy="12" r="6" fill="white" stroke="#607D8B" stroke-width="2"/>
  <circle cx="9.5" cy="11.5" r="1.5" fill="#607D8B"/>
  <circle cx="14.5" cy="11.5" r="1.5" fill="#607D8B"/>
  <path d="M9 15C9.5 15.5 10.7 16 12 16C13.3 16 14.5 15.5 15 15" stroke="#607D8B" stroke-width="1.5" stroke-linecap="round"/>
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
          <div id="threads-container" style="
            max-height: 150px;
            overflow-y: auto;
            margin-bottom: 10px;
          ">
            <ul id='threads' style="list-style: none; padding: 0; margin: 0;"></ul>
          </div>
          <button id="new-thread-btn" style="
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 10px;
  width: 100%;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-top: 5px;
">
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 16 16">
    <path d="M8 2v12M2 8h12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  New Chat
</button>

<button id="clear-history" style="
            display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 10px;
  width: 100%;
  background-color: #ff4d4f;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-top: 5px;
          ">🗑 Clear All</button>

          <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
          <button id="report-bug-btn" style="width: 100%; padding: 0.25rem; background-color: #e5e7eb; color: #1f2937; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background-color 0.2s;">
            <svg style="width: 0.75rem; height: 0.75rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Report Bug
          </button>
          <button id="get-help-btn" style="width: 100%; padding: 0.25rem; background-color: #e5e7eb; color: #1f2937; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background-color 0.2s;">
            <svg style="width: 0.75rem; height: 0.75rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            Get Help
          </button>
          <button id="privacy-policy-btn" style="width: 100%; padding: 0.25rem; background-color: #e5e7eb; color: #1f2937; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background-color 0.2s;">
            <svg style="width: 0.75rem; height: 0.75rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            Privacy Policy
          </button>
        </div>
        </div>

        <!-- Main Content Area -->
        <div id="main-content" style="flex: 1; padding: 20px;">
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

    // Dynamically adjust threads container height to match main content area
    function adjustThreadsContainerHeight() {
      const mainContent = document.getElementById("main-content");
      const threadsContainer = document.getElementById("threads-container");
      //if (mainContent && threadsContainer) {
      // const mainContentHeight = mainContent.getBoundingClientRect().height;
      //threadsContainer.style.maxHeight = `${mainContentHeight}px`;
      // }
    }

    // Call adjustThreadsContainerHeight after threads are rendered
    function renderThreads() {
      chrome.storage.local.get({ threads: [] }, function (result) {
        let threads = result.threads;

        // Sort threads by creation date (newest first)
        threads = threads.sort((a, b) => b.created - a.created);

        // Ensure at least one thread is active
        const hasActiveThread = threads.some((t) => t.isActive === "yes");
        if (!hasActiveThread && threads.length > 0) {
          threads = threads.map((t, index) => ({
            ...t,
            isActive: index === 0 ? "yes" : "no", // Set newest thread (first after sort) as active
          }));
          chrome.storage.local.set({ threads: threads }, () => {
            console.log("Set newest thread as active:", threads[0]);
          });
        }

        const threadsList = document.getElementById("threads");
        threadsList.innerHTML = ""; // Clear existing threads

        threads.forEach((thread) => {
          const li = document.createElement("li");
          li.style.padding = "10px";
          li.style.cursor = "pointer";
          li.style.backgroundColor =
            thread.isActive === "yes" ? "#ddd" : "transparent";
          li.style.borderBottom = "1px solid #eee";
          li.style.display = "flex";
          li.style.alignItems = "center";

          const threadNameSpan = document.createElement("span");
          threadNameSpan.textContent = thread.name;
          threadNameSpan.style.display = "inline-block";
          threadNameSpan.style.width = "calc(100% - 60px)"; // Adjusted for two buttons

          const editBtn = document.createElement("button");
          editBtn.textContent = "✏️";
          editBtn.style.background = "none";
          editBtn.style.border = "none";
          editBtn.style.cursor = "pointer";
          editBtn.style.marginRight = "5px";

          const deleteBtn = document.createElement("button");
          deleteBtn.textContent = "🗑️";
          deleteBtn.style.background = "none";
          deleteBtn.style.border = "none";
          deleteBtn.style.cursor = "pointer";

          editBtn.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent thread activation on edit
            const newName = prompt("Enter new thread name:", thread.name);
            if (newName && newName.trim()) {
              const updatedThreads = threads.map((t) =>
                t.id === thread.id ? { ...t, name: newName.trim() } : t,
              );
              chrome.storage.local.set({ threads: updatedThreads }, () => {
                renderThreads();
              });
            }
          });

          deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent thread activation on delete
            if (confirm(`Are you sure you want to delete "${thread.name}"?`)) {
              chrome.storage.local.get(
                { threads: [], chats: [] },
                function (data) {
                  // Remove thread
                  let updatedThreads = data.threads.filter(
                    (t) => t.id !== thread.id,
                  );
                  // Remove associated chats
                  const updatedChats = data.chats.filter(
                    (chat) => chat.threadId !== thread.id,
                  );

                  // Sort threads by creation date (newest first)
                  updatedThreads = updatedThreads.sort(
                    (a, b) => b.created - a.created,
                  );

                  // Ensure an active thread exists
                  const hasActiveThreadAfterDelete = updatedThreads.some(
                    (t) => t.isActive === "yes",
                  );
                  if (
                    !hasActiveThreadAfterDelete &&
                    updatedThreads.length > 0
                  ) {
                    updatedThreads = updatedThreads.map((t, index) => ({
                      ...t,
                      isActive: index === 0 ? "yes" : "no", // Set newest thread as active
                    }));
                  }

                  chrome.storage.local.set(
                    { threads: updatedThreads, chats: updatedChats },
                    () => {
                      renderThreads();
                      const newActiveThread = updatedThreads.find(
                        (t) => t.isActive === "yes",
                      );
                      if (newActiveThread) {
                        renderChatMessages(newActiveThread.id);
                      } else {
                        renderChatMessages(updatedThreads[0]?.id || "");
                      }
                    },
                  );
                },
              );
            }
          });

          li.addEventListener("click", () => {
            const updatedThreads = threads.map((t) => ({
              ...t,
              isActive: t.id === thread.id ? "yes" : "no",
            }));
            chrome.storage.local.set({ threads: updatedThreads }, () => {
              renderThreads();
              renderChatMessages(thread.id); // Render messages for active thread
            });
          });

          li.appendChild(threadNameSpan);
          li.appendChild(editBtn);
          li.appendChild(deleteBtn);
          threadsList.appendChild(li);
        });

        // Adjust threads container height after rendering
        adjustThreadsContainerHeight();
      });
    }

    // Report Bug | Get Help | Privacy Policy
    const reportBtn = document.getElementById("report-bug-btn");

    reportBtn.addEventListener("click", function() {
      window.open(
        "https://docs.google.com/forms/d/e/1FAIpQLScSfquZW5idQXGsCHXc-OlMaa97eh_1i9BnmMf7Ea9HVSFQzg/viewform?usp=sharing&ouid=107403711423930702162",
        "_blank"
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

    // Function to create new thread
    document
      .getElementById("new-thread-btn")
      .addEventListener("click", function () {
        chrome.storage.local.get({ threads: [] }, function (result) {
          const threads = result.threads;
          const id = "thread_" + Date.now();
          const newThread = {
            id,
            name: `Thread ${threads.length + 1}`,
            created: Date.now(),
            isActive: "yes",
            messages: [],
          };

          // Set all other threads to inactive
          const updatedThreads = threads.map((t) => ({ ...t, isActive: "no" }));
          updatedThreads.push(newThread);

          chrome.storage.local.set({ threads: updatedThreads }, function () {
            console.log("New thread created:", newThread);
            renderThreads();
            renderChatMessages(id);
          });
        });
      });

    // Function to render chat messages for a specific thread
    function renderChatMessages(activeThreadId) {
  chrome.storage.local.get({ chats: [] }, function (result) {
    const chatDisplay = document.getElementById("chat-display");
    chatDisplay.innerHTML = ""; // Clear existing content

    const threadChats = result.chats.filter(
      (chat) => chat.threadId === activeThreadId
    );

    threadChats.forEach((chat) => {
      const messageElement = document.createElement("div");
      messageElement.style.display = "flex";
      messageElement.style.alignItems = "flex-start";
      messageElement.style.marginBottom = "10px";

      const bubbleContainer = document.createElement("div");
      bubbleContainer.style.maxWidth = "70%";
      bubbleContainer.style.display = "flex";
      bubbleContainer.style.flexDirection = "column";

      const messageBubble = document.createElement("div");
      messageBubble.style.padding = "10px 15px";
      messageBubble.style.borderRadius = chat.role === "user" ? "15px 15px 0 15px" : "15px 15px 15px 0";
      messageBubble.style.wordBreak = "break-word";
      messageBubble.textContent = chat.text;

      const timestamp = document.createElement("div");
      timestamp.style.fontSize = "12px";
      timestamp.style.color = "#555";
      timestamp.style.marginTop = "5px";
      timestamp.textContent = new Date(chat.date).toLocaleString();

      const iconContainer = document.createElement("div");
      iconContainer.style.margin = chat.role === "user" ? "0 0 0 10px" : "0 10px 0 0";

      if (chat.role === "user") {
        messageElement.style.justifyContent = "flex-end";
        bubbleContainer.style.alignItems = "flex-end";
        messageBubble.style.backgroundColor = "#007bff";
        messageBubble.style.color = "white";
        iconContainer.innerHTML = userIcon;
      } else {
        messageElement.style.justifyContent = "flex-start";
        bubbleContainer.style.alignItems = "flex-start";
        messageBubble.style.backgroundColor = "#e5e7eb";
        messageBubble.style.color = "#1f2937";
        iconContainer.innerHTML = aiIcon;
      }

      bubbleContainer.appendChild(messageBubble);
      bubbleContainer.appendChild(timestamp);
      messageElement.appendChild(chat.role === "user" ? bubbleContainer : iconContainer);
      messageElement.appendChild(chat.role === "user" ? iconContainer : bubbleContainer);
      chatDisplay.appendChild(messageElement);
    });

    // Auto-scroll to the latest message
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
  });
}

function showTypingNotification(chatDisplay) {
  const typingElement = document.createElement("div");
  typingElement.id = "typing-notification";
  typingElement.style.display = "flex";
  typingElement.style.alignItems = "flex-start";
  typingElement.style.justifyContent = "flex-start";
  typingElement.style.marginBottom = "10px";

  const bubbleContainer = document.createElement("div");
  bubbleContainer.style.maxWidth = "70%";
  bubbleContainer.style.display = "flex";
  bubbleContainer.style.flexDirection = "column";
  bubbleContainer.style.alignItems = "flex-start";

  const typingBubble = document.createElement("div");
  typingBubble.style.backgroundColor = "#e5e7eb";
  typingBubble.style.color = "#1f2937";
  typingBubble.style.padding = "10px 15px";
  typingBubble.style.borderRadius = "15px 15px 15px 0";
  typingBubble.style.wordBreak = "break-word";
  typingBubble.textContent = "AI is typing...";

  const iconContainer = document.createElement("div");
  iconContainer.style.marginRight = "10px";
  iconContainer.innerHTML = aiIcon;

  bubbleContainer.appendChild(typingBubble);
  typingElement.appendChild(iconContainer);
  typingElement.appendChild(bubbleContainer);
  chatDisplay.appendChild(typingElement);
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

function hideTypingNotification() {
  const typingElement = document.getElementById("typing-notification");
  if (typingElement) {
    typingElement.remove();
  }
}

    // Initial render of threads
    renderThreads();

    // Initial render of threads and ensure active thread
    chrome.storage.local.get({ threads: [] }, function (result) {
      let threads = result.threads;

      // Sort threads by creation date (newest first)
      threads = threads.sort((a, b) => b.created - a.created);

      // Ensure at least one thread is active
      const hasActiveThread = threads.some((t) => t.isActive === "yes");
      if (!hasActiveThread && threads.length > 0) {
        threads = threads.map((t, index) => ({
          ...t,
          isActive: index === 0 ? "yes" : "no", // Set newest thread as active
        }));
        chrome.storage.local.set({ threads: threads }, () => {
          console.log("Set newest thread as active:", threads[0]);
          renderThreads();
          renderChatMessages(threads[0].id);
        });
      } else if (threads.length === 0) {
        // Create a new thread if none exist
        const newThread = {
          id: "thread_" + Date.now(),
          name: "Thread 1",
          created: Date.now(),
          isActive: "yes",
          messages: [],
        };
        chrome.storage.local.set({ threads: [newThread] }, () => {
          renderThreads();
          renderChatMessages(newThread.id);
        });
      } else {
        renderThreads();
        const activeThread = threads.find((t) => t.isActive === "yes");
        renderChatMessages(activeThread.id);
      }
    });

    const customAIInput = document.getElementById("custom-ai-input");

    // Auto-save on reload if input is pre-filled
    if (customAIInput.value.trim()) {
  const inputText = customAIInput.value.trim();
  const timestamp = new Date().toISOString();
  const chatDisplay = document.getElementById("chat-display");

  chrome.storage.local.get({ chats: [], threads: [] }, async function (result) {
    const chats = result.chats;
    const activeThread = result.threads.find((t) => t.isActive === "yes");
    if (!activeThread) return; // No active thread, skip saving

    const recentUserMessages = chats
      .slice(-5)
      .filter((entry) => entry.role === "user" && entry.threadId === activeThread.id)
      .slice(-5);

    const isDuplicate = recentUserMessages.some((entry) => entry.text === inputText);

    if (!isDuplicate) {
      const userMessage = {
        text: inputText,
        date: timestamp,
        role: "user",
        threadId: activeThread.id,
      };
      chats.push(userMessage);

      await new Promise((resolve) => {
        chrome.storage.local.set({ chats: chats }, () => {
          console.log("Auto-saved input after reload:", inputText);
          renderChatMessages(activeThread.id);
          resolve();
        });
      });

      // Show typing notification
      showTypingNotification(chatDisplay);

      customAIInput.value = "";

      // Send user message to API
      try {
        const aiResponse = await sendToApi(inputText);
        const aiMessage = {
          text: aiResponse,
          date: new Date().toISOString(),
          role: "ai",
          threadId: activeThread.id,
        };
        chats.push(aiMessage);

        chrome.storage.local.set({ chats: chats }, () => {
          console.log("AI response saved:", aiResponse);
          hideTypingNotification();
          renderChatMessages(activeThread.id);
        });
      } catch (error) {
        console.error("Failed to get AI response:", error);
        hideTypingNotification();
        const errorMessage = {
          text: "Error: Could not get AI response.",
          date: new Date().toISOString(),
          role: "ai",
          threadId: activeThread.id,
        };
        chats.push(errorMessage);
        chrome.storage.local.set({ chats: chats }, () => {
          renderChatMessages(activeThread.id);
        });
      }
    } else {
      console.log("Duplicate detected:", inputText);
    }
  });
}

    // Handle Enter key to save and display new messages
    customAIInput.addEventListener("keydown", async function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    const inputText = customAIInput.value.trim();
    if (!inputText) return;

    const timestamp = new Date().toISOString();
    const chatDisplay = document.getElementById("chat-display");

    chrome.storage.local.get({ chats: [], threads: [] }, async function (result) {
      const chats = result.chats;
      const activeThread = result.threads.find((t) => t.isActive === "yes");
      if (!activeThread) return; // No active thread, skip saving

      // Save user message
      const userMessage = {
        text: inputText,
        date: timestamp,
        role: "user",
        threadId: activeThread.id,
      };
      chats.push(userMessage);

      // Update storage with user message and re-render
      await new Promise((resolve) => {
        chrome.storage.local.set({ chats: chats }, () => {
          console.log("User message saved:", inputText);
          renderChatMessages(activeThread.id);
          resolve();
        });
      });

      // Show typing notification
      showTypingNotification(chatDisplay);

      // Send user message to API
      try {
        const aiResponse = await sendToApi(inputText);
        const aiMessage = {
          text: aiResponse,
          date: new Date().toISOString(),
          role: "ai",
          threadId: activeThread.id,
        };
        chats.push(aiMessage);

        // Update storage with AI response and re-render
        chrome.storage.local.set({ chats: chats }, () => {
          console.log("AI response saved:", aiResponse);
          hideTypingNotification();
          renderChatMessages(activeThread.id);
        });
      } catch (error) {
        console.error("Failed to get AI response:", error);
        hideTypingNotification();
        const errorMessage = {
          text: "Error: Could not get AI response.",
          date: new Date().toISOString(),
          role: "ai",
          threadId: activeThread.id,
        };
        chats.push(errorMessage);
        chrome.storage.local.set({ chats: chats }, () => {
          renderChatMessages(activeThread.id);
        });
      }
    });

    customAIInput.value = "";
  }
});

    // Adjust threads container height on window resize
    window.addEventListener("resize", adjustThreadsContainerHeight);
  }

  async function sendToApi(text) {
    const payload = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: text,
        },
      ],
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return data.response || "Keine Antwort erhalten.";
    } catch (error) {
      console.error("API Error:", error);
      return `Error: ${error.message}`;
    }
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
