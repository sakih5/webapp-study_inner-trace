'use client';

import { useState } from 'react';

interface CopyButtonProps {
  getText: () => string;
  label?: string;
}

export function CopyButton({ getText, label = 'コピー' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    await navigator.clipboard.writeText(getText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <button
      onClick={handleClick}
      className={`font-mono text-[10px] px-2 py-1 border rounded transition-colors ${
        copied
          ? 'border-keep text-keep'
          : 'border-border text-ink-light hover:border-ink hover:text-ink'
      }`}
    >
      {copied ? '✓ コピー済' : label}
    </button>
  );
}
