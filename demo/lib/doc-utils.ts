declare const Prism: { highlightElement(el: Element): void };

/** Return an HTML-escaped `<pre><code>` block with copy button and Prism highlighting */
export function code(lang: string, src: string): string {
  const escaped = src
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<div class="doc-code-block"><button class="doc-code-copy" aria-label="Copy to clipboard">Copy</button><pre><code class="language-${lang}">${escaped}</code></pre></div>`;
}

/** Render prev/next navigation links at the bottom of a doc page */
export function docNav(
  prev?: { href: string; label: string },
  next?: { href: string; label: string },
): string {
  return `
    <nav class="doc-nav">
      ${prev ? `<a href="${prev.href}" class="doc-nav-link doc-nav-prev"><span class="doc-nav-dir">Previous</span><span class="doc-nav-label">${prev.label}</span></a>` : '<span></span>'}
      ${next ? `<a href="${next.href}" class="doc-nav-link doc-nav-next"><span class="doc-nav-dir">Next</span><span class="doc-nav-label">${next.label}</span></a>` : '<span></span>'}
    </nav>
  `;
}

/** Call after page render to highlight all code blocks and wire up copy buttons */
export function highlightAll(): void {
  requestAnimationFrame(() => {
    document.querySelectorAll('code[class*="language-"]').forEach((el) => {
      if (typeof Prism !== 'undefined') Prism.highlightElement(el);
    });

    document.querySelectorAll<HTMLButtonElement>('.doc-code-copy').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const code = btn.closest('.doc-code-block')?.querySelector('code')?.textContent ?? '';
        try {
          await navigator.clipboard.writeText(code);
          btn.textContent = 'Copied!';
        } catch {
          btn.textContent = 'Failed';
        }
        setTimeout(() => (btn.textContent = 'Copy'), 1500);
      });
    });
  });
}
