/**
 * Play a blob via a real <audio> in the document — most reliable on iOS Safari when
 * Web Audio (buffer or MediaElementSource) stays silent after tap.
 * Call from a pointer/touch handler without awaiting anything before play().
 */
export function playBlobWithInlineAudio(blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const el = document.createElement('audio');
    el.setAttribute('playsinline', 'true');
    el.setAttribute('webkit-playsinline', 'true');
    el.preload = 'auto';
    el.volume = 1;
    el.src = url;
    el.style.cssText = 'position:fixed;left:-9999px;width:1px;height:1px;opacity:0';
    document.body.appendChild(el);

    const tearDown = () => {
      try {
        el.pause();
      } catch {
        /* */
      }
      el.remove();
      URL.revokeObjectURL(url);
    };

    el.onended = () => {
      tearDown();
      resolve();
    };
    el.onerror = () => {
      tearDown();
      reject(new Error('Inline audio error'));
    };

    try {
      const p = el.play();
      if (p !== undefined) {
        void p.catch((err: unknown) => {
          tearDown();
          reject(err instanceof Error ? err : new Error(String(err)));
        });
      }
    } catch (err) {
      tearDown();
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}
