'use client';

interface PackageCardData {
  id: string;
  title: string;
  destination: string;
  nights: number;
  price: number;
  image?: string;
  inclusions: string[];
  hotelClass?: string;
}

interface PackageCardsProps {
  packages: PackageCardData[];
  onSelect: (packageId: string, packageTitle: string) => void;
  disabled?: boolean;
  timestamp?: number;
  headerMessage?: string;
}

// Default placeholder images for destinations
const defaultImages: Record<string, string> = {
  goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400',
  udaipur: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400',
  manali: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400',
  kerala: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400',
  jaipur: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400',
  default: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400',
};

function getDefaultImage(destination: string): string {
  const key = destination.toLowerCase();
  return defaultImages[key] || defaultImages.default;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
}

function SingleCard({
  pkg,
  onSelect,
  disabled,
}: {
  pkg: PackageCardData;
  onSelect: (id: string, title: string) => void;
  disabled?: boolean;
}) {
  const imageUrl = pkg.image || getDefaultImage(pkg.destination);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow w-[300px] flex-shrink-0">
      <div className="relative h-36">
        <img
          src={imageUrl}
          alt={pkg.title}
          className="w-full h-full object-cover"
        />
        {pkg.hotelClass && (
          <div className="absolute top-3 left-3 bg-yellow-400 px-2.5 py-1 rounded-xl">
            <span className="text-xs font-bold text-yellow-900">{pkg.hotelClass}</span>
          </div>
        )}
      </div>

      <div className="p-3.5">
        <h4 className="font-bold text-gray-900 text-[17px] leading-5 mb-2 line-clamp-2">
          {pkg.title}
        </h4>

        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1 text-gray-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span className="text-[13px]">{pkg.destination}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.34 11l-3.54-3.54 1.41-1.41 4.95 4.95-4.95 4.95-1.41-1.41L17.34 13H1v-2h16.34z"/>
            </svg>
            <span className="text-[13px]">{pkg.nights} Nights</span>
          </div>
        </div>

        <div className="mb-3 space-y-1">
          {pkg.inclusions.slice(0, 3).map((item, index) => (
            <div key={index} className="flex items-start gap-1.5">
              <span className="text-green-600 text-xs font-bold mt-0.5">✓</span>
              <span className="text-[13px] text-gray-700 line-clamp-1 flex-1">{item}</span>
            </div>
          ))}
          {pkg.inclusions.length > 3 && (
            <p className="text-xs text-blue-600 font-medium mt-1">
              +{pkg.inclusions.length - 3} more inclusions
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <p className="text-[11px] text-gray-500">Starting from</p>
            <p className="text-xl font-bold text-green-600">{formatPrice(pkg.price)}</p>
            <p className="text-[11px] text-gray-500">per person</p>
          </div>

          <button
            onClick={() => onSelect(pkg.id, pkg.title)}
            disabled={disabled}
            className="bg-blue-600 text-white px-5 py-2 rounded-full font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
}

export function PackageCards({
  packages,
  onSelect,
  disabled,
  timestamp,
  headerMessage,
}: PackageCardsProps) {
  const formatTime = (ts?: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

      <div className="flex-1">
        {/* Header Message */}
        {headerMessage && (
          <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm mb-2">
            <p className="text-[15px] text-gray-900 leading-5">{headerMessage}</p>
            {timestamp && (
              <span className="text-[11px] text-gray-400 float-right mt-1">
                {formatTime(timestamp)}
              </span>
            )}
          </div>
        )}

        {/* Horizontal Scrolling Cards */}
        <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="flex gap-3">
            {packages.map((pkg) => (
              <SingleCard
                key={pkg.id}
                pkg={pkg}
                onSelect={onSelect}
                disabled={disabled}
              />
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center mt-2">← Scroll to see more options →</p>
      </div>
    </div>
  );
}
