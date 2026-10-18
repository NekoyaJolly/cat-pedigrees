'use client';

import { useEffect, type RefObject } from 'react';

// キーボードで表示領域が狭くなった場合も、入力欄と保存欄の重なりを避ける。
export function useFormViewport(formRef: RefObject<HTMLDivElement | null>, savebarRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const viewport = window.visualViewport;
    let frame = 0;
    const adjust = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bar = savebarRef.current;
        const field = document.activeElement;
        const editing = field instanceof HTMLInputElement && formRef.current?.contains(field);
        const narrow = window.innerWidth < 1024;
        const keyboardOffset = narrow && editing && viewport?.scale === 1
          ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
          : 0;
        bar?.style.setProperty('--keyboard-offset', keyboardOffset + 'px');
        if (!narrow || !editing || !bar) return;
        const top = (viewport?.offsetTop ?? 0) + 12;
        const bottom = Math.min((viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight), bar.getBoundingClientRect().top) - 12;
        const rect = field.getBoundingClientRect();
        if (rect.bottom > bottom) window.scrollBy(0, rect.bottom - bottom);
        else if (rect.top < top) window.scrollBy(0, rect.top - top);
      });
    };
    document.addEventListener('focusin', adjust);
    document.addEventListener('focusout', adjust);
    window.addEventListener('resize', adjust);
    viewport?.addEventListener('resize', adjust);
    viewport?.addEventListener('scroll', adjust);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('focusin', adjust);
      document.removeEventListener('focusout', adjust);
      window.removeEventListener('resize', adjust);
      viewport?.removeEventListener('resize', adjust);
      viewport?.removeEventListener('scroll', adjust);
    };
  }, [formRef, savebarRef]);
}
