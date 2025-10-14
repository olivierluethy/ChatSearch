(function () {
  const CONTAINER_ID = "custom-ai-box";
  const STORAGE_KEY = "aiSidebarWidth";

  function createUI(targetDiv) {
    if (document.getElementById(CONTAINER_ID)) return;

    const savedWidth = localStorage.getItem(STORAGE_KEY);
    const sidebarWidth = savedWidth ? parseInt(savedWidth, 10) : 200;

    const googleSearchInput = document.querySelector("textarea");

    const uiContainer = document.createElement("div");
    uiContainer.id = CONTAINER_ID;
    uiContainer.style.cssText = `
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
    `;

    const sidebar = document.createElement("div");
    sidebar.style.cssText = `
      background-color: #f4f4f4;
      padding: 20px;
      width: ${sidebarWidth}px;
      min-width: 100px;
      max-width: 400px;
      border-right: 1px solid #ddd;
      box-sizing: border-box;
    `;
    sidebar.innerHTML = `
      <h3 style="margin-top: 0; font-size: 18px;">AI Models</h3>
      <ul style="list-style: none; padding: 0; margin: 0;">
        <li style="margin-bottom: 10px; cursor: pointer;">🔹 GPT-4</li>
        <li style="margin-bottom: 10px; cursor: pointer;">🔸 Claude 2</li>
        <li style="margin-bottom: 10px; cursor: pointer;">🟢 Gemini</li>
        <li style="margin-bottom: 10px; cursor: pointer;">⚙️ Custom Model</li>
      </ul>
    `;

    const resizer = document.createElement("div");
    resizer.style.cssText = `
      width: 5px;
      cursor: ew-resize;
      background-color: #ddd;
      height: auto;
    `;

    const mainContent = document.createElement("div");
    mainContent.style.cssText = `
      flex: 1;
      padding: 20px;
      box-sizing: border-box;
    `;
    mainContent.innerHTML = `
      <h2 style="margin-top: 0;">Talk to AI</h2>
      <input value="${googleSearchInput ? googleSearchInput.value : ''}" type="text" placeholder="Type your message here..." style="
        width: 100%;
        padding: 12px;
        font-size: 16px;
        border: 1px solid #ccc;
        border-radius: 6px;
        box-sizing: border-box;
      " />
    `;

    // Append children
    uiContainer.appendChild(sidebar);
    uiContainer.appendChild(resizer);
    uiContainer.appendChild(mainContent);
    targetDiv.insertBefore(uiContainer, targetDiv.firstChild);

    // Resizing logic
    let isResizing = false;

    resizer.addEventListener("mousedown", (e) => {
      isResizing = true;
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isResizing) return;
      const containerLeft = uiContainer.getBoundingClientRect().left;
      let newWidth = e.clientX - containerLeft;
      newWidth = Math.max(100, Math.min(newWidth, 400)); // clamp width
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
