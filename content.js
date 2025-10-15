(function () {
  const CONTAINER_ID = "custom-ai-box";
  let activeThreadId = null;
  let autoScrollEnabled = true; // 🆕 Autoscroll-Zustand global

  function formatDate(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${d
      .getDate()
      .toString()
      .padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  }

  function getThreads() {
    return new Promise((resolve) => {
      chrome.storage.local.get({ threads: [] }, (res) => {
        resolve(Array.isArray(res.threads) ? res.threads : []);
      });
    });
  }

  function saveThreads(threads) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ threads }, () => resolve());
    });
  }

  function setActiveThreadId(id) {
    activeThreadId = id;
    chrome.storage.local.set({ activeThreadId: id });
  }

  async function createNewThread() {
    const threads = await getThreads();
    const id = "thread_" + Date.now();
    const newThread = {
      id,
      name: `Thread ${threads.length + 1}`,
      created: Date.now(),
      messages: [],
    };
    threads.push(newThread);
    await saveThreads(threads);
    setActiveThreadId(id);
    renderThreadList(threads);
    renderMessages(newThread.messages);
  }

  async function renameThread(threadId, newName) {
    let threads = await getThreads();
    const thread = threads.find((t) => t.id === threadId);
    if (thread) {
      thread.name = newName.trim() || thread.name;
      await saveThreads(threads);
      renderThreadList(threads);
    }
  }

  async function deleteThread(threadId) {
    let threads = await getThreads();
    threads = threads.filter((t) => t.id !== threadId);
    if (threadId === activeThreadId) {
      const next = threads.length > 0 ? threads[threads.length - 1].id : null;
      setActiveThreadId(next);
    }
    await saveThreads(threads);
    renderThreadList(threads);
    if (activeThreadId) {
      const active = threads.find((t) => t.id === activeThreadId);
      renderMessages(active ? active.messages : []);
    } else {
      renderMessages([]);
    }
  }

  async function saveMessageToActiveThread(text, role = "user") {
    if (!text.trim()) return;
    let threads = await getThreads();
    if (!activeThreadId) {
      await createNewThread();
      threads = await getThreads();
    }
    const thread = threads.find((t) => t.id === activeThreadId);
    if (!thread) return;
    thread.messages.push({
      id: "msg_" + Date.now(),
      text: text.trim(),
      timestamp: Date.now(),
      role,
    });
    await saveThreads(threads);
    renderMessages(thread.messages);
  }

  async function maybeAutoRespond() {
    const threads = await getThreads();
    const thread = threads.find((t) => t.id === activeThreadId);
    if (!thread || thread.messages.length === 0) return;

    const lastMsg = thread.messages[thread.messages.length - 1];

    if (lastMsg.role === "user") {
      const response = await sendToApi(lastMsg.text);
      await saveMessageToActiveThread(response, "ai");
    }
  }

  async function clearAllThreads() {
    await saveThreads([]);
    setActiveThreadId(null);
    renderThreadList([]);
    renderMessages([]);
  }

  function renderThreadList(threads) {
    const container = document.getElementById("chat-thread-list");
    if (!container) return;
    container.innerHTML = "";

    if (threads.length === 0) {
      container.innerHTML = `<div style="padding:8px; color:#666;">No chats yet</div>`;
      return;
    }

    threads
      .slice()
      .reverse()
      .forEach((thread) => {
        const div = document.createElement("div");
        div.style = `
          padding:6px 8px;
          border-bottom:1px solid #f0f0f0;
          display:flex;
          justify-content:space-between;
          align-items:center;
          background:${thread.id === activeThreadId ? "#d0e7ff" : "white"};
          border-radius:4px;
          cursor:pointer;
        `;

        const title = document.createElement("strong");
        title.style =
          "font-size:13px; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;";
        title.textContent = thread.name;

        const time = document.createElement("span");
        time.style = "font-size:11px; color:#666; display:block;";
        time.textContent = formatDate(thread.created);

        const titleWrapper = document.createElement("div");
        titleWrapper.style = "flex:1; display:flex; flex-direction:column;";
        titleWrapper.appendChild(title);
        titleWrapper.appendChild(time);

        const editBtn = document.createElement("button");
        editBtn.innerHTML = "✏️";
        editBtn.style = `
          border:none;
          background:none;
          cursor:pointer;
          font-size:14px;
          margin-left:8px;
        `;
        editBtn.title = "Edit Thread";

        const delBtn = document.createElement("button");
        delBtn.textContent = "🗑";
        delBtn.style = `
          border:none;
          background:none;
          cursor:pointer;
          font-size:14px;
          color: red;
          margin-left:8px;
        `;
        delBtn.title = "Delete Thread";
        delBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (confirm(`Delete thread “${thread.name}”?`)) {
            deleteThread(thread.id);
          }
        });

        const saveBtn = document.createElement("button");
        saveBtn.textContent = "✅";
        saveBtn.style = `
          border:none;
          background:none;
          cursor:pointer;
          font-size:14px;
          margin-left:8px;
          display:none;
        `;
        saveBtn.title = "Änderung speichern";

        div.addEventListener("click", async () => {
          setActiveThreadId(thread.id);
          renderThreadList(await getThreads());
          renderMessages(thread.messages);
        });

        editBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const input = document.createElement("input");
          input.type = "text";
          input.value = thread.name;
          input.style = "width:100%; font-size:13px; padding:2px;";
          titleWrapper.replaceChild(input, title);
          input.focus();

          editBtn.style.display = "none";
          delBtn.style.display = "none";
          saveBtn.style.display = "inline";

          const save = () => {
            renameThread(thread.id, input.value);
          };

          input.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter") save();
          });

          saveBtn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            save();
          });
        });

        div.appendChild(titleWrapper);
        div.appendChild(editBtn);
        div.appendChild(delBtn);
        div.appendChild(saveBtn);
        container.appendChild(div);
      });
  }

  function renderMessages(messages) {
    const area = document.getElementById("chat-message-area");
    if (!area) return;
    area.innerHTML = "";
    if (!messages || messages.length === 0) {
      area.innerHTML = `<div style="color:#777; font-size:14px;">No messages in this thread.</div>`;
      return;
    }
    messages.forEach((m) => {
      const div = document.createElement("div");
      div.style = `
        padding:8px;
        margin-bottom:6px;
        border-radius:6px;
        background:#f1f1f1;
      `;
      div.innerHTML = `
        <div style="font-size:14px;">${escapeHtml(m.text)}</div>
        <div style="font-size:11px; color:#888;">${formatDate(m.timestamp)}</div>
      `;
      area.appendChild(div);
    });

    requestAnimationFrame(() => {
      if (autoScrollEnabled) {
        area.scrollTop = area.scrollHeight;
      }
    });
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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

  function createUI(targetDiv) {
    if (document.getElementById(CONTAINER_ID)) return;
    const googleSearchInput = document.querySelector("textarea");

    const uiContainer = document.createElement("div");
    uiContainer.id = CONTAINER_ID;
    uiContainer.style.position = "relative";
    uiContainer.innerHTML = `
      <div style="
        display: flex;
        width: 80%;
        margin: 2em auto;
        border-radius: 12px;
        box-shadow: 0px 0px 36px 0px rgba(255,255,255,0.6);
      -webkit-box-shadow: 0px 0px 36px 0px rgba(255,255,255,0.6);
      -moz-box-shadow: 0px 0px 36px 0px rgba(255,255,255,0.6);
        font-family: 'Segoe UI', sans-serif;
        overflow: hidden;
        background-color: #fff;
        color: black;
        min-height: 300px;
        max-height: 600px;
      ">
        <!-- Sidebar -->
        <div style="
          background-color: #f4f4f4;
          padding: 20px;
          width: 200px;
          border-right: 1px solid #ddd;
          overflow-y:auto;
        ">
          <h2 style="margin-top: 0; font-size: 18px;">Chat Threads</h2>
          <div id="chat-thread-list" style="
            max-height: 200px;
            overflow-y: auto;
            margin-bottom: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
            background: #fff;
            padding: 5px;
          "></div>
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
            width: 100%;
            background-color: #ff4d4f;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            margin-top: 10px;
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

        <!-- Main Content -->
        <div style="flex: 1; padding: 20px; display:flex; flex-direction:column; position:relative;">
          <h2 style="margin-top: 0;">Talk to ChatGPT</h2>
          <div id="chat-message-area" style="
            flex:1;
            overflow-y:auto;
            max-height:400px;
            min-height:200px;
            border:1px solid #ddd;
            padding:10px;
            margin-bottom:10px;
            border-radius:6px;
            background:#fafafa;
          "></div>
          <button id="scroll-to-bottom" style="
            position:absolute;
            bottom:70px;
            right:30px;
            background:#007bff;
            color:white;
            padding:6px 10px;
            border:none;
            border-radius:20px;
            cursor:pointer;
            display:none;
            box-shadow:0 2px 8px rgba(0,0,0,0.2);
          ">⬇ Scroll to latest</button>
          <div style="display: flex; gap: 10px; align-items: center;">
          <input id="custom-ai-input" type="text" placeholder="Type your message here..." style="
            flex: 1;
          padding: 12px;
          font-size: 1rem;
          border: 1px solid #ccc;
          border-radius: 20px;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.2s;
          " />
          <button id="sendToApi" style="
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
        </div>
      </div>
    `;
    targetDiv.insertBefore(uiContainer, targetDiv.firstChild);

    document.getElementById("new-thread-btn").addEventListener("click", createNewThread);
    document.getElementById("clear-history").addEventListener("click", () => {
      if (confirm("Are you sure you want to delete all chat threads?")) clearAllThreads();
    });

    const input = document.getElementById("custom-ai-input");
    input.addEventListener("keydown", async (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const val = input.value.trim();
        if (val !== "") {
          await saveMessageToActiveThread(val, "user");
          input.value = "";
          await maybeAutoRespond();
        }
      }
    });

    const submitButton = document.getElementById("sendToApi");
    submitButton.addEventListener("click", async (e) =>{
      const val = input.value.trim();
        if (val !== "") {
          await saveMessageToActiveThread(val, "user");
          input.value = "";
          await maybeAutoRespond();
        }
    })
    
    if (googleSearchInput) {
  googleSearchInput.addEventListener("keydown", async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const val = googleSearchInput.value.trim();
      if (val !== "") {
        await saveMessageToActiveThread(val, "user");
        googleSearchInput.value = "";
        await maybeAutoRespond(); // 👈
      }
    }
  });
}

    // 🆕 Scroll-Verhalten
    const chatArea = document.getElementById("chat-message-area");
    const scrollBtn = document.getElementById("scroll-to-bottom");

    chatArea.addEventListener("scroll", () => {
      const nearBottom =
        chatArea.scrollHeight - chatArea.scrollTop - chatArea.clientHeight < 50;
      autoScrollEnabled = nearBottom;
      scrollBtn.style.display = nearBottom ? "none" : "block";
    });

    scrollBtn.addEventListener("click", () => {
      chatArea.scrollTop = chatArea.scrollHeight;
      autoScrollEnabled = true;
      scrollBtn.style.display = "none";
    });

    Promise.all([
      getThreads(),
      new Promise((resolve) => {
        chrome.storage.local.get({ activeThreadId: null }, (res) => {
          activeThreadId = res.activeThreadId;
          resolve();
        });
      }),
    ]).then(([threads]) => {
      renderThreadList(threads);
      if (activeThreadId) {
        const active = threads.find((t) => t.id === activeThreadId);
        if (active) renderMessages(active.messages);
      }
    });
  }

  function init() {
    const targetDiv = document.getElementById("appbar");
    if (targetDiv) createUI(targetDiv);
  }

  const observer = new MutationObserver(() => {
    const targetDiv = document.getElementById("appbar");
    if (targetDiv && !document.getElementById(CONTAINER_ID)) createUI(targetDiv);
  });

  window.addEventListener("load", async () => {
    const body = document.body;
    if (body) {
      observer.observe(body, { childList: true, subtree: true });
      init();
      await maybeAutoRespond();
    }
  });
})();
