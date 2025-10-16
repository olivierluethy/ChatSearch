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

        const userChats = result.chats.filter(
          (chat) => chat.role === "user" && chat.threadId === activeThreadId,
        );

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

      chrome.storage.local.get({ chats: [], threads: [] }, function (result) {
        const chats = result.chats;
        const activeThread = result.threads.find((t) => t.isActive === "yes");
        if (!activeThread) return; // No active thread, skip saving

        const recentUserMessages = chats
          .slice(-5)
          .filter(
            (entry) =>
              entry.role === "user" && entry.threadId === activeThread.id,
          )
          .slice(-5);

        const isDuplicate = recentUserMessages.some(
          (entry) => entry.text === inputText,
        );

        if (!isDuplicate) {
          chats.push({
            text: inputText,
            date: timestamp,
            role: "user",
            threadId: activeThread.id,
          });

          chrome.storage.local.set({ chats: chats }, function () {
            console.log("Auto-saved input after reload:", inputText);
            renderChatMessages(activeThread.id);
          });
        } else {
          console.log("Duplicate detected:", inputText);
        }

        customAIInput.value = "";
      });
    }

    // Handle Enter key to save and display new messages
    customAIInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        const inputText = customAIInput.value.trim();
        if (!inputText) return;

        const timestamp = new Date().toISOString();

        chrome.storage.local.get({ chats: [], threads: [] }, function (result) {
          const chats = result.chats;
          const activeThread = result.threads.find((t) => t.isActive === "yes");
          if (!activeThread) return; // No active thread, skip saving

          chats.push({
            text: inputText,
            date: timestamp,
            role: "user",
            threadId: activeThread.id,
          });

          chrome.storage.local.set({ chats: chats }, function () {
            console.log("Message saved:", inputText);
            renderChatMessages(activeThread.id);
          });
        });

        customAIInput.value = "";
      }
    });

    // Adjust threads container height on window resize
    window.addEventListener("resize", adjustThreadsContainerHeight);
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
