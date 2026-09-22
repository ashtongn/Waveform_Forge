// Trigger a browser download of an in-memory text payload.
export function downloadBlob(
  filename: string,
  mime: string,
  text: string,
): void {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

// Print an HTML document through a hidden iframe. Cleanup runs on afterprint
// with a timeout fallback so the iframe is removed even if the user cancels.
export function printHtml(html: string): void {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.srcdoc = html;

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    iframe.remove();
  };

  iframe.onload = () => {
    const frameWindow = iframe.contentWindow;
    if (!frameWindow) {
      cleanup();
      return;
    }
    frameWindow.addEventListener('afterprint', cleanup);
    frameWindow.focus();
    frameWindow.print();
    window.setTimeout(cleanup, 60000);
  };

  document.body.appendChild(iframe);
}
