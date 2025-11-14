(() => {
  // WICHTIG: Zugriff auf Shadow DOM über shadowRoot
  const shadowRoot = document.getElementById('ai-chat-root')?.shadowRoot;
  if (!shadowRoot) {
    console.error('Shadow Root nicht gefunden!');
    return;
  }

  const get = (id) => shadowRoot.getElementById(id);
  const windowEl = get('chatWindow');
  const titleBar = get('titleBar');
  const burgerBtn = get('burgerBtn');
  const menu = get('menu');
  const resizer = get('resizer');
  const menuResizer = get('menuResizer');

  if (!windowEl || !menu) {
    console.error('Chat-Elemente nicht gefunden!');
    return;
  }

  const threadItems = menu.querySelectorAll('.thread-list li');
  const actionButtons = menu.querySelectorAll('.menu-actions button');

  let lastCustomWidth = 180;
  let isDragging = false, isResizing = false, isResizingMenu = false;
  let offsetX, offsetY, startX, startY, startWidth, startHeight, startMenuX, startMenuWidth;

  // --- Drag Fenster ---
  titleBar.addEventListener('mousedown', (e) => {
    if (e.target.closest('#burgerBtn')) return;
    isDragging = true;
    offsetX = e.clientX - windowEl.offsetLeft;
    offsetY = e.clientY - windowEl.offsetTop;
    titleBar.style.cursor = 'grabbing';
  });

  // --- Resize Fenster ---
  resizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = parseInt(getComputedStyle(windowEl).width, 10);
    startHeight = parseInt(getComputedStyle(windowEl).height, 10);
  });

  // --- Resize Sidebar ---
  menuResizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    if (menu.classList.contains('collapsed')) return;
    isResizingMenu = true;
    startMenuX = e.clientX;
    startMenuWidth = parseInt(getComputedStyle(menu).width, 10);
  });

  // --- Global Move/Resize ---
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      windowEl.style.left = `${e.clientX - offsetX}px`;
      windowEl.style.top = `${e.clientY - offsetY}px`;
    }
    if (isResizing) {
      const newWidth = startWidth + (e.clientX - startX);
      const newHeight = startHeight + (e.clientY - startY);
      windowEl.style.width = `${Math.max(newWidth, 320)}px`;
      windowEl.style.height = `${Math.max(newHeight, 240)}px`;
    }
    if (isResizingMenu) {
      const newMenuWidth = startMenuWidth + (e.clientX - startMenuX);
      const clampedWidth = Math.max(newMenuWidth, 60);
      menu.style.width = `${clampedWidth}px`;
      lastCustomWidth = clampedWidth;
      updateMenuAppearance(clampedWidth);
      updateTooltips();
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = isResizing = isResizingMenu = false;
    titleBar.style.cursor = 'move';
  });

  // --- Burger Toggle ---
  burgerBtn.addEventListener('click', () => {
    const isCollapsed = menu.classList.contains('collapsed');
    if (isCollapsed) {
      menu.classList.remove('collapsed');
      menu.style.width = `${lastCustomWidth}px`;
      updateMenuAppearance(lastCustomWidth);
      updateTooltips();
    } else {
      lastCustomWidth = parseInt(getComputedStyle(menu).width, 10);
      menu.classList.add('collapsed');
    }
  });

  // --- Menü Modus ---
  function updateMenuAppearance(width) {
    menu.classList.toggle('narrow', width < 130);
    updateTooltips();
  }

  function updateTooltips() {
    [...threadItems, ...actionButtons].forEach(el => {
      const span = el.querySelector('span');
      if (menu.classList.contains('narrow') && span) {
        el.title = span.textContent;
      } else {
        el.removeAttribute('title');
      }
    });
  }

  // --- Init ---
  const initialWidth = parseInt(getComputedStyle(menu).width, 10);
  lastCustomWidth = initialWidth;
  updateMenuAppearance(initialWidth);
  updateTooltips();

  // --- ResizeObserver ---
  new ResizeObserver(() => {
    if (!isResizingMenu && !menu.classList.contains('collapsed')) {
      const currentWidth = parseInt(getComputedStyle(menu).width, 10);
      lastCustomWidth = currentWidth;
      updateMenuAppearance(currentWidth);
    }
  }).observe(menu);
})();