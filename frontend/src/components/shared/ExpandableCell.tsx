'use client';

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type CSSProperties,
} from 'react';

interface ExpandableCellProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onCommit?: (value: string) => void; // blur時のみ呼ばれる（仮行用）。指定時はデバウンス保存を行わない
  autoOpen?: boolean; // 仮行追加時などにマウント後に自動展開
}

// シンプルなdebounce実装（lodash不要）
function makeDebounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  wait: number,
): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  return debounced as T & { cancel: () => void };
}

export function ExpandableCell({ value, placeholder, onChange, onCommit, autoOpen }: ExpandableCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [popupStyle, setPopupStyle] = useState<CSSProperties>({});
  const cellRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isComposing = useRef(false);

  // 外部valueが変わったとき（別操作でロールバック等）に同期
  useEffect(() => {
    if (!isOpen) setLocalValue(value);
  }, [value, isOpen]);

  const calcPopupStyle = useCallback((): CSSProperties => {
    if (!cellRef.current) return {};
    const rect = cellRef.current.getBoundingClientRect();
    const vv = window.visualViewport;
    const viewportHeight = vv?.height ?? window.innerHeight;
    const offsetTop = vv?.offsetTop ?? 0;
    const isMobile = window.innerWidth < 768;
    const popupWidth = isMobile ? window.innerWidth * 0.9 : 340;
    const popupHeight = 140;

    let top = rect.bottom + 4 - offsetTop;
    if (top + popupHeight > viewportHeight) {
      top = Math.max(4, rect.top - popupHeight - 4 - offsetTop);
    }
    const left = isMobile
      ? window.innerWidth * 0.05
      : Math.min(rect.left, window.innerWidth - popupWidth - 12);

    return { position: 'fixed', top, left, width: popupWidth, zIndex: 500 };
  }, []);

  const updatePosition = useCallback(() => {
    if (!isOpen) return;
    setPopupStyle(calcPopupStyle());
  }, [isOpen, calcPopupStyle]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.visualViewport?.addEventListener('resize', updatePosition);
    window.visualViewport?.addEventListener('scroll', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.visualViewport?.removeEventListener('resize', updatePosition);
      window.visualViewport?.removeEventListener('scroll', updatePosition);
    };
  }, [isOpen, updatePosition]);

  const debouncedSave = useMemo(
    () => makeDebounce((v: string) => onChange(v), 800),
    [onChange],
  );

  const handleOpen = useCallback(() => {
    setPopupStyle(calcPopupStyle());
    setIsOpen(true);
    setTimeout(() => {
      const ta = textareaRef.current;
      if (ta) {
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
      }
    }, 10);
  }, [calcPopupStyle]);

  // autoOpen: マウント時に一度だけ自動展開（仮行の action セル用）
  const hasAutoOpened = useRef(false);
  useEffect(() => {
    if (!autoOpen || hasAutoOpened.current) return;
    hasAutoOpened.current = true;
    const t = setTimeout(handleOpen, 50);
    return () => clearTimeout(t);
  }, [autoOpen, handleOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
    if (!onCommit && !isComposing.current) debouncedSave(e.target.value);
  };

  const handleCompositionStart = () => {
    isComposing.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    isComposing.current = false;
    if (!onCommit) debouncedSave(e.currentTarget.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSaveButton();
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    debouncedSave.cancel();
    if (onCommit) {
      onCommit(e.target.value);
    } else {
      onChange(e.target.value);
    }
    setTimeout(() => setIsOpen(false), 120);
  };

  const handleSaveButton = () => {
    debouncedSave.cancel();
    if (onCommit) {
      onCommit(localValue);
    } else {
      onChange(localValue);
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* セルのプレビュー表示 */}
      <div
        ref={cellRef}
        onClick={handleOpen}
        className="w-full cursor-text break-words font-mono text-[12px] px-2 py-1 text-ink min-h-[28px]"
      >
        {localValue || (
          <span className="text-ink-light">{placeholder}</span>
        )}
      </div>

      {/* 展開ポップアップ */}
      {isOpen && (
        <div
          style={{
            ...popupStyle,
            border: '1.5px solid var(--accent)',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            backgroundColor: 'var(--bg)',
          }}
        >
          <textarea
            ref={textareaRef}
            value={localValue}
            onChange={handleChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            maxLength={5000}
            className="w-full p-2 font-mono text-[12px] resize-none outline-none text-ink bg-transparent"
            style={{
              minHeight: '80px',
              borderBottom: '1px solid var(--border)',
            }}
          />
          {/* フッター: onMouseDown で preventDefault し textarea の blur を防ぐ */}
          <div
            className="px-2 py-1 flex items-center justify-between"
            onMouseDown={e => e.preventDefault()}
          >
            <span className="font-mono text-[9px] text-ink-light">フォーカスを外すと閉じます</span>
            <button
              onClick={handleSaveButton}
              className="font-mono text-[10px] px-2 py-0.5 bg-ink text-bg rounded hover:opacity-80 transition-opacity"
            >
              保存
            </button>
          </div>
        </div>
      )}
    </>
  );
}
