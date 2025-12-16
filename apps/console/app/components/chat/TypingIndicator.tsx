'use client';

import { useEffect, useState } from 'react';

interface Props {
  visible?: boolean;
}

export function TypingIndicator({ visible = true }: Props) {
  const [dots, setDots] = useState([false, false, false]);

  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setDots(prev => {
        const newDots = [...prev];
        const activeIndex = newDots.findIndex(d => d);
        
        if (activeIndex === -1) {
          newDots[0] = true;
        } else if (activeIndex === 2) {
          newDots[0] = false;
          newDots[1] = false;
          newDots[2] = false;
        } else {
          newDots[activeIndex] = false;
          newDots[activeIndex + 1] = true;
        }
        
        return newDots;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="flex items-end gap-2 px-4 mb-4">
      <div className="flex-shrink-0 mb-1">
        <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center text-white">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        </div>
      </div>

      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1 h-5">
          {dots.map((isActive, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                isActive ? 'bg-gray-600 opacity-100 -translate-y-1' : 'bg-gray-400 opacity-40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
