'use client';

import { QuickReplyButton } from './QuickReplyButton';

interface QuickReplyOption {
  label: string;
  value: string | number;
}

interface Props {
  message: string;
  isUser?: boolean;
  quickReplies?: QuickReplyOption[];
  onQuickReplySelect?: (value: string | number) => void;
  quickRepliesDisabled?: boolean;
  timestamp?: number;
  status?: 'sent' | 'delivered' | 'read';
  showAvatar?: boolean;
}

export function ChatBubble({
  message,
  isUser,
  quickReplies,
  onQuickReplySelect,
  quickRepliesDisabled,
  timestamp,
  status = 'read',
  showAvatar = true,
}: Props) {
  const formatTime = (ts?: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      default:
        return '';
    }
  };

  return (
    <div className={`flex mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 px-4`}>
      {!isUser && showAvatar && (
        <div className="relative flex-shrink-0 mb-1">
          <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-teal-500 rounded-full border-2 border-gray-100"></div>
        </div>
      )}

      <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`relative px-4 py-2 rounded-2xl shadow-sm ${
          isUser 
            ? 'bg-blue-100 rounded-tr-sm' 
            : 'bg-white rounded-tl-sm'
        }`}>
          {/* Tail */}
          <div className={`absolute w-0 h-0 top-0 ${
            isUser 
              ? 'right-0 -mr-1 border-l-[6px] border-l-blue-100 border-t-[6px] border-t-blue-100 border-r-[6px] border-r-transparent border-b-[6px] border-b-transparent'
              : 'left-0 -ml-1 border-r-[6px] border-r-white border-t-[6px] border-t-white border-l-[6px] border-l-transparent border-b-[6px] border-b-transparent'
          }`}></div>

          <p className={`text-[15px] leading-5 whitespace-pre-wrap ${isUser ? 'text-gray-900' : 'text-gray-900'}`}>
            {message}
          </p>

          <div className="flex items-center justify-end gap-1 mt-1">
            {timestamp && (
              <span className={`text-[11px] ${isUser ? 'text-gray-600' : 'text-gray-400'}`}>
                {formatTime(timestamp)}
              </span>
            )}
            {isUser && (
              <span className={`text-xs ${status === 'read' ? 'text-blue-600' : 'text-gray-400'}`}>
                {getStatusIcon()}
              </span>
            )}
          </div>
        </div>

        {!isUser && quickReplies && quickReplies.length > 0 && (
          <QuickReplyButton
            options={quickReplies}
            onSelect={onQuickReplySelect || (() => {})}
            disabled={quickRepliesDisabled}
          />
        )}
      </div>
    </div>
  );
}
