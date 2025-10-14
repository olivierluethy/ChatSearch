(function () {
  const CONTAINER_ID = "custom-ai-box";
  let activeThreadId = null;

  function formatDate(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
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

  async function saveMessageToActiveThread(text) {
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
    });
    await saveThreads(threads);
    renderMessages(thread.messages);
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
        title.style = "font-size:13px; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;";
        title.textContent = thread.name;

        const time = document.createElement("span");
        time.style = "font-size:11px; color:#666; display:block;";
        time.textContent = formatDate(thread.created);

        const titleWrapper = document.createElement("div");
        titleWrapper.style = "flex:1; display:flex; flex-direction:column;";
        titleWrapper.appendChild(title);
        titleWrapper.appendChild(time);

        // ✏️ Bearbeiten-Button
        const editBtn = document.createElement("button");
        editBtn.innerHTML = "✏️";
        editBtn.style = `
          border:none;
          background:none;
          cursor:pointer;
          font-size:14px;
          margin-left:8px;
        `;
        editBtn.title = "Thread bearbeiten";

        // 🗑 Löschen-Button
        const delBtn = document.createElement("button");
        delBtn.textContent = "🗑";
        delBtn.style = `
          border:none;
          background:none;
          cursor:pointer;
          font-size:14px;
          margin-left:8px;
        `;
        delBtn.title = "Thread löschen";
        delBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (confirm(`Thread "${thread.name}" löschen?`)) {
            deleteThread(thread.id);
          }
        });

        // ✅ Speichern-Button (nur bei Bearbeitung)
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

        // 📌 Aktivieren
        div.addEventListener("click", async () => {
          setActiveThreadId(thread.id);
          renderThreadList(await getThreads());
          renderMessages(thread.messages);
        });

        // Bearbeiten-Logik
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
      area.innerHTML = `<div style="color:#777; font-size:14px;">Keine Nachrichten in diesem Thread.</div>`;
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
    area.scrollTop = area.scrollHeight;
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function createUI(targetDiv) {
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
        <!-- Sidebar -->
        <div style="
          background-color: #f4f4f4;
          padding: 20px;
          width: 200px;
          border-right: 1px solid #ddd;
        ">
          <h3 style="margin-top: 0; font-size: 18px;">Chat Threads</h3>
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
            padding: 6px 10px;
            width: 100%;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
            margin-top: 5px;
          ">➕ New Chat</button>
          <button id="clear-history" style="
            padding: 10px;
            width: 100%;
            background-color: #ff4d4f;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            margin-top: 10px;
          ">🗑 Clear All</button>
        </div>

        <!-- Main Content -->
        <div style="flex: 1; padding: 20px; display:flex; flex-direction:column;">
          <h2 style="margin-top: 0;">Talk to AI</h2>
          <div id="chat-message-area" style="
            flex:1;
            overflow-y:auto;
            border:1px solid #ddd;
            padding:10px;
            margin-bottom:10px;
            border-radius:6px;
            background:#fafafa;
          "></div>
          <input id="custom-ai-input" type="text" placeholder="Type your message here..." style="
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

    document.getElementById("new-thread-btn").addEventListener("click", createNewThread);
    document.getElementById("clear-history").addEventListener("click", () => {
      if (confirm("Alle Chat-Threads wirklich löschen?")) clearAllThreads();
    });

    const input = document.getElementById("custom-ai-input");
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const val = input.value.trim();
        if (val !== "") {
          saveMessageToActiveThread(val);
          input.value = "";
        }
      }
    });

    if (googleSearchInput) {
      googleSearchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          const val = googleSearchInput.value.trim();
          if (val !== "") {
            saveMessageToActiveThread(val);
          }
        }
      });
    }

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

  window.addEventListener("load", () => {
    const body = document.body;
    if (body) {
      observer.observe(body, { childList: true, subtree: true });
      init();
    }
  });
})();
