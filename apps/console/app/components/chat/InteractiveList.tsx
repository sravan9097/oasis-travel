'use client';

import { useState } from 'react';

interface ListRow {
  id: string;
  title: string;
  description?: string;
}

interface ListSection {
  title: string;
  rows: ListRow[];
}

interface InteractiveListProps {
  header: string;
  body: string;
  buttonText: string;
  sections: ListSection[];
  onSelect: (rowId: string, rowTitle: string) => void;
  disabled?: boolean;
  timestamp?: number;
}

export function InteractiveList({
  header,
  body,
  buttonText,
  sections,
  onSelect,
  disabled,
  timestamp,
}: InteractiveListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (ts?: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleRowSelect = (row: ListRow) => {
    if (disabled) return;
    setIsExpanded(false);
    onSelect(row.id, row.title);
  };

  return (
    <div className="flex items-start gap-2 px-4 mb-4">
      <div className="flex-shrink-0 mt-1">
        <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        </div>
      </div>

      <div className="flex-1 max-w-[85%]">
        {/* Header Message Bubble */}
        <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-1">{header}</h4>
          <p className="text-sm text-gray-600 leading-5">{body}</p>

          {timestamp && (
            <div className="flex justify-end mt-1">
              <span className="text-[11px] text-gray-400">{formatTime(timestamp)}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={toggleExpand}
          disabled={disabled}
          className={`
            flex items-center justify-center gap-2 w-full
            bg-white border-2 border-blue-600 text-blue-600
            rounded-xl px-4 py-2.5 mt-2
            font-semibold text-[15px]
            transition-all duration-200
            hover:bg-blue-50 hover:shadow-sm
            disabled:opacity-60 disabled:cursor-not-allowed disabled:border-gray-300
            shadow-sm
          `}
        >
          <span className={disabled ? 'text-gray-400' : ''}>{buttonText}</span>
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''} ${disabled ? 'text-gray-400' : ''}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </button>

        {/* Expandable List */}
        {isExpanded && (
          <div className="bg-white rounded-xl mt-2 overflow-hidden shadow-md">
            {sections.map((section, sectionIndex) => (
              <div
                key={sectionIndex}
                className={sectionIndex < sections.length - 1 ? 'border-b border-gray-200' : ''}
              >
                {section.title && (
                  <div className="bg-gray-50 px-4 py-2.5">
                    <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {section.title}
                    </h5>
                  </div>
                )}
                {section.rows.map((row, rowIndex) => (
                  <button
                    key={row.id}
                    onClick={() => handleRowSelect(row)}
                    className={`
                      w-full flex items-center justify-between px-4 py-3
                      hover:bg-gray-50 transition-colors text-left
                      ${rowIndex < section.rows.length - 1 ? 'border-b border-gray-100' : ''}
                    `}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-[15px]">{row.title}</p>
                      {row.description && (
                        <p className="text-sm text-gray-600 mt-0.5">{row.description}</p>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                    </svg>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
