import { useCallback, useRef } from 'react';

/**
 * ResizeHandle — a draggable vertical divider between columns.
 * Drag left/right to resize adjacent panels.
 *
 * @param {function} onResize - Called with delta pixels during drag
 * @param {string} color - Handle accent color (shows on hover/drag)
 */
export default function ResizeHandle({ onResize, color = '#2a2a2a' }) {
  const dragging = useRef(false);
  const startX = useRef(0);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    startX.current = e.clientX;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev) => {
      if (!dragging.current) return;
      const delta = ev.clientX - startX.current;
      startX.current = ev.clientX;
      onResize?.(delta);
    };

    const onMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [onResize]);

  return (
    <div
      onMouseDown={onMouseDown}
      className="flex-shrink-0 group relative"
      style={{ width: '6px', cursor: 'col-resize' }}
    >
      {/* Visible line */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px transition-colors duration-150"
        style={{ backgroundColor: color }} />
      {/* Wider hover target */}
      <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-white/5 transition-colors" />
      {/* Drag indicator dots */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex flex-col gap-1">
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />
        </div>
      </div>
    </div>
  );
}
