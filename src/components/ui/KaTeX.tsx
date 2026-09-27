import { useEffect, useRef } from 'react';
import katex from 'katex';

interface KaTeXProps {
  latex: string;
  displayMode?: boolean;
  /** Keep the existing default for catalog content; the Canvas passes false (FR-VIS-010). */
  trust?: boolean;
}

export function KaTeX({ latex, displayMode = true, trust = true }: KaTeXProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(latex, containerRef.current, {
          displayMode,
          throwOnError: false,
          errorColor: '#ef4444',
          strict: false,
          trust,
          macros: {
            "\\R": "\\mathbb{R}",
            "\\N": "\\mathbb{N}",
            "\\Z": "\\mathbb{Z}",
            "\\Q": "\\mathbb{Q}",
            "\\C": "\\mathbb{C}",
          },
        });
      } catch (error) {
        console.error('KaTeX rendering error:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `<span class="text-red-400">${latex}</span>`;
        }
      }
    }
  }, [latex, displayMode, trust]);
  
  return (
    <div
      ref={containerRef}
      className={`${displayMode ? 'katex-display' : 'katex-inline'} overflow-x-auto max-w-full`}
    />
  );
}

export default KaTeX;
