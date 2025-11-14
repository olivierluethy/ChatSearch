(() => {
  if (document.getElementById('ai-chat-root')) return;

  const shadowHost = document.createElement('div');
  shadowHost.id = 'ai-chat-root';
  Object.assign(shadowHost.style, {
    all: 'initial',
    position: 'fixed',
    top: '0',
    left: '0',
    width: '0',
    height: '0',
    zIndex: '2147483647',
    pointerEvents: 'none',
    contain: 'layout style'
  });

  // WICHTIG: mode: 'open' → script.js kann zugreifen!
  const shadow = shadowHost.attachShadow({ mode: 'open' });

  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = chrome.runtime.getURL('styles.css');

  const container = document.createElement('div');
  container.id = 'chat-container';
  container.style.pointerEvents = 'auto';
  container.innerHTML = `
    <div class="window" id="chatWindow">
      <div class="title-bar" id="titleBar">
        <span>Chat Threads</span>
        <div class="burger" id="burgerBtn">
          <div></div><div></div><div></div>
        </div>
      </div>
      <div class="menu" id="menu">
        <ul class="thread-list">
          ${Array.from({ length: 10 }, (_, i) => `
            <li data-icon="Thread ${i + 1}"><span>Thread ${i + 1}</span></li>
          `).join('')}
        </ul>
        <div class="menu-actions">
          <button data-icon="+"><span>New Chat</span></button>
          <button data-icon="Clear"><span>Clear All</span></button>
          <button data-icon="Bug"><span>Report Bug</span></button>
          <button data-icon="?"><span>Get Help</span></button>
        </div>
        <div class="menu-resizer" id="menuResizer"></div>
      </div>
      <div class="chat" id="chatArea">
        <p><strong>Talk to AI:</strong></p>
        <p>Hallo! Willkommen im Chatfenster.</p>
        <p>Ziehe das Fenster, ändere seine Größe oder passe die Seitenleiste an.</p>
        <div style="display: flex; gap: 8px; margin-top: auto;">
          <input type="text" placeholder="Nachricht eingeben..." />
          <button>Senden</button>
        </div>
      </div>
      <div class="resizer" id="resizer"></div>
    </div>
  `;

  // Script nach DOM einfügen → DOM-Ready garantiert
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('script.js');

  shadow.appendChild(styleLink);
  shadow.appendChild(container);
  shadow.appendChild(script);

  document.body.appendChild(shadowHost);

  // --- Toggle: Strg+Shift+C oder Popup ---
  const toggleChat = () => {
    const win = shadow.querySelector('#chatWindow');
    if (win) {
      win.style.display = win.style.display === 'none' ? 'flex' : 'none';
    }
  };

  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      toggleChat();
    }
  });

  window.toggleAIChat = toggleChat;
})();