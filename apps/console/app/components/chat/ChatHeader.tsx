'use client';

interface Props {
  title?: string;
  subtitle?: string;
  isOnline?: boolean;
  onInfoPress?: () => void;
}

export function ChatHeader({
  title = 'Oasis Travel Bot',
  subtitle = 'Your personal trip planner',
  isOnline = true,
  onInfoPress,
}: Props) {
  return (
    <div className="bg-blue-600 shadow-lg">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Avatar with Online Indicator */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-teal-500 rounded-full border-2 border-blue-600"></div>
            )}
          </div>

          {/* Title and Subtitle */}
          <div>
            <div className="flex items-center gap-1">
              <h3 className="text-white font-semibold text-[17px]">{title}</h3>
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12zm-13 5l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
              </svg>
            </div>
            <p className="text-white/85 text-[13px]">
              {isOnline ? subtitle : 'Connecting...'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center">
          {onInfoPress && (
            <button
              onClick={onInfoPress}
              className="text-white hover:bg-white/10 p-2 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
