declare const Prism: { highlightElement(el: Element): void };

interface Tab {
  label: string;
  lang: string;
  code: string;
}

export function createCodeBlock(tabs: Tab[]): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'code-block';

  // Tab bar (only if multiple tabs)
  if (tabs.length > 1) {
    const tabBar = document.createElement('div');
    tabBar.className = 'code-block-tabs';
    tabs.forEach((tab, i) => {
      const btn = document.createElement('button');
      btn.className = `code-block-tab${i === 0 ? ' active' : ''}`;
      btn.textContent = tab.label;
      btn.addEventListener('click', () => {
        tabBar.querySelectorAll('.code-block-tab').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        wrapper.querySelectorAll('.code-block-panel').forEach((p) => p.classList.remove('active'));
        wrapper.querySelectorAll('.code-block-panel')[i]?.classList.add('active');
      });
      tabBar.appendChild(btn);
    });
    wrapper.appendChild(tabBar);
  }

  // Panels
  tabs.forEach((tab, i) => {
    const panel = document.createElement('div');
    panel.className = `code-block-panel code-block-content${i === 0 ? ' active' : ''}`;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'code-block-copy';
    copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(tab.code.trim());
        copyBtn.textContent = 'Copied!';
      } catch {
        copyBtn.textContent = 'Failed';
      }
      setTimeout(() => (copyBtn.textContent = 'Copy'), 1500);
    });

    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.className = `language-${tab.lang}`;
    code.textContent = tab.code.trim();
    pre.appendChild(code);

    panel.appendChild(copyBtn);
    panel.appendChild(pre);
    wrapper.appendChild(panel);
  });

  // Highlight after DOM insertion
  requestAnimationFrame(() => {
    wrapper.querySelectorAll('code[class*="language-"]').forEach((el) => {
      if (typeof Prism !== 'undefined') Prism.highlightElement(el);
    });
  });

  return wrapper;
}

/** Insert a code block into a container by selector */
export function renderCodeBlock(containerSelector: string, tabs: Tab[]) {
  const container = document.querySelector(containerSelector);
  if (container) container.appendChild(createCodeBlock(tabs));
}
