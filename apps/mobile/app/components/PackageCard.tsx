import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Avatar, IconButton, Button } from 'react-native-paper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;

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
  disabled 
}: { 
  pkg: PackageCardData; 
  onSelect: (id: string, title: string) => void;
  disabled?: boolean;
}) {
  const imageUrl = pkg.image || getDefaultImage(pkg.destination);

  return (
    <View style={styles.card}>
      <Image 
        source={{ uri: imageUrl }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      
      {pkg.hotelClass && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pkg.hotelClass}</Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{pkg.title}</Text>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <IconButton icon="map-marker" size={16} iconColor="#6B7280" style={styles.infoIcon} />
            <Text style={styles.infoText}>{pkg.destination}</Text>
          </View>
          <View style={styles.infoItem}>
            <IconButton icon="weather-night" size={16} iconColor="#6B7280" style={styles.infoIcon} />
            <Text style={styles.infoText}>{pkg.nights} Nights</Text>
          </View>
        </View>

        <View style={styles.inclusionsList}>
          {pkg.inclusions.slice(0, 3).map((item, index) => (
            <View key={index} style={styles.inclusionItem}>
              <Text style={styles.inclusionCheck}>✓</Text>
              <Text style={styles.inclusionText} numberOfLines={1}>{item}</Text>
            </View>
          ))}
          {pkg.inclusions.length > 3 && (
            <Text style={styles.moreInclusions}>
              +{pkg.inclusions.length - 3} more inclusions
            </Text>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.priceLabel}>Starting from</Text>
            <Text style={styles.price}>{formatPrice(pkg.price)}</Text>
            <Text style={styles.priceNote}>per person</Text>
          </View>
          
          <Button
            mode="contained"
            onPress={() => onSelect(pkg.id, pkg.title)}
            disabled={disabled}
            style={styles.selectButton}
            labelStyle={styles.selectButtonLabel}
          >
            Select
          </Button>
        </View>
      </View>
    </View>
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
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <Avatar.Icon 
          size={36} 
          icon="robot" 
          style={styles.avatar}
          color="#FFFFFF"
        />
      </View>
      
      <View style={styles.messageWrapper}>
        {/* Header Message */}
        {headerMessage && (
          <View style={styles.headerBubble}>
            <Text style={styles.headerText}>{headerMessage}</Text>
            {timestamp && (
              <Text style={styles.timestamp}>{formatTime(timestamp)}</Text>
            )}
          </View>
        )}

        {/* Horizontal Scrolling Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + 12}
          snapToAlignment="start"
        >
          {packages.map((pkg) => (
            <SingleCard
              key={pkg.id}
              pkg={pkg}
              onSelect={onSelect}
              disabled={disabled}
            />
          ))}
        </ScrollView>

        <Text style={styles.swipeHint}>← Swipe to see more options →</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 12,
    marginVertical: 8,
  },
  avatarContainer: {
    marginRight: 8,
    marginTop: 4,
  },
  avatar: {
    backgroundColor: '#25D366',
  },
  messageWrapper: {
    flex: 1,
  },
  headerBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderTopLeftRadius: 4,
    padding: 12,
    marginRight: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  cardsContainer: {
    paddingRight: 12,
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#E5E7EB',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FCD34D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  cardContent: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    margin: 0,
    marginRight: -4,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
  },
  inclusionsList: {
    marginBottom: 14,
  },
  inclusionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  inclusionCheck: {
    fontSize: 12,
    color: '#10B981',
    marginRight: 6,
    fontWeight: '700',
  },
  inclusionText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
  },
  moreInclusions: {
    fontSize: 12,
    color: '#0066CC',
    marginTop: 4,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  priceLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
  },
  priceNote: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  selectButton: {
    backgroundColor: '#0066CC',
    borderRadius: 20,
  },
  selectButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  swipeHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    marginRight: 12,
  },
});
