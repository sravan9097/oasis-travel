import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

const translations = {
  en: {
    welcome: 'Welcome to Oasis Travel',
    signIn: 'Sign In',
    browseAsGuest: 'Browse as Guest',
    emergency: 'Emergency',
    emergencyHelp: 'Emergency Help',
    weRespondIn: 'We\'ll respond in ≤5 minutes',
    callEmergencySupport: 'Call Emergency Support',
    reportIssue: 'Report an Issue',
    transportIssue: 'Transport Issue',
    hotelIssue: 'Hotel Issue',
    billingQuery: 'Billing Query',
    other: 'Other',
    howCanWeHelp: 'How can we help?',
    selectTrip: 'Select Trip',
    urgency: 'Urgency',
    normal: 'Normal',
    urgent: 'Urgent',
    category: 'Category',
    description: 'Description',
    submitIssue: 'Submit Issue',
    contactInformation: 'Contact Information',
    available247: 'Available 24/7 for emergencies',
    whenToUseEmergency: 'When to Use Emergency Support',
    seriousSafetyConcerns: 'Serious safety concerns',
    strandedWithoutTransport: 'Stranded without transport',
    hotelRefusingAccommodation: 'Hotel refusing accommodation',
    anyUrgentTravelCrisis: 'Any urgent travel crisis',
    forNonEmergencies: 'For Non-Emergencies',
    useRegularSupportForm: 'Use the regular support form for routine issues like minor delays, billing questions, or general inquiries.',
    backToSupport: 'Back to Support',
    medicalEmergency: 'Medical Emergency',
    medicalEmergencyDescription: 'For immediate medical emergencies, call 112 (India) or local emergency services.',
    call112: 'Call 112',
    issueReported: 'Issue Reported',
    issueReportedMessage: 'Our team will respond shortly. We typically respond within 30 minutes.',
    emergencyAlertSent: 'Emergency Alert Sent',
    emergencyAlertSentMessage: 'Our team has been notified and will call you shortly.',
    offlineMessage: 'You\'re offline. Some features may be limited.',
    dismiss: 'Dismiss',
  },
  hi: {
    welcome: 'ओएसिस ट्रैवल में आपका स्वागत है',
    signIn: 'साइन इन करें',
    browseAsGuest: 'अतिथि के रूप में ब्राउज़ करें',
    emergency: 'आपातकाल',
    emergencyHelp: 'आपातकालीन सहायता',
    weRespondIn: 'हम ≤5 मिनट में जवाब देंगे',
    callEmergencySupport: 'आपातकालीन सहायता कॉल करें',
    reportIssue: 'समस्या की रिपोर्ट करें',
    transportIssue: 'परिवहन समस्या',
    hotelIssue: 'होटल समस्या',
    billingQuery: 'बिलिंग प्रश्न',
    other: 'अन्य',
    howCanWeHelp: 'हम आपकी कैसे मदद कर सकते हैं?',
    selectTrip: 'यात्रा चुनें',
    urgency: 'तात्कालिकता',
    normal: 'सामान्य',
    urgent: 'जरूरी',
    category: 'श्रेणी',
    description: 'विवरण',
    submitIssue: 'समस्या सबमिट करें',
    contactInformation: 'संपर्क जानकारी',
    available247: 'आपातकाल के लिए 24/7 उपलब्ध',
    whenToUseEmergency: 'आपातकालीन सहायता कब उपयोग करें',
    seriousSafetyConcerns: 'गंभीर सुरक्षा चिंताएं',
    strandedWithoutTransport: 'बिना परिवहन के फंसे हुए',
    hotelRefusingAccommodation: 'होटल आवास से इनकार कर रहा है',
    anyUrgentTravelCrisis: 'कोई भी जरूरी यात्रा संकट',
    forNonEmergencies: 'गैर-आपातकालीन के लिए',
    useRegularSupportForm: 'मामूली देरी, बिलिंग प्रश्न, या सामान्य पूछताछ जैसे नियमित मुद्दों के लिए नियमित सहायता फॉर्म का उपयोग करें।',
    backToSupport: 'सहायता पर वापस जाएं',
    medicalEmergency: 'चिकित्सा आपातकाल',
    medicalEmergencyDescription: 'तत्काल चिकित्सा आपातकाल के लिए, 112 (भारत) या स्थानीय आपातकालीन सेवाओं को कॉल करें।',
    call112: '112 कॉल करें',
    issueReported: 'समस्या रिपोर्ट की गई',
    issueReportedMessage: 'हमारी टीम जल्द ही जवाब देगी। हम आमतौर पर 30 मिनट के भीतर जवाब देते हैं।',
    emergencyAlertSent: 'आपातकालीन अलर्ट भेजा गया',
    emergencyAlertSentMessage: 'हमारी टीम को सूचित किया गया है और वे जल्द ही आपको कॉल करेंगे।',
    offlineMessage: 'आप ऑफलाइन हैं। कुछ सुविधाएं सीमित हो सकती हैं।',
    dismiss: 'खारिज करें',
  },
};

const i18n = new I18n(translations);

// Get locale and extract language code
function getLocale(): string {
  try {
    const locale = Localization.locale || Localization.getLocales()?.[0]?.languageCode;
    if (!locale) return 'en';
    
    // Extract language code (e.g., "en-US" -> "en", "hi_IN" -> "hi")
    const languageCode = locale.split('-')[0].split('_')[0];
    
    // Check if we have translations for this language
    if (translations[languageCode as keyof typeof translations]) {
      return languageCode;
    }
    
    return 'en';
  } catch (error) {
    console.warn('Error getting locale:', error);
    return 'en';
  }
}

// Set the locale once at the beginning of your app
i18n.locale = getLocale();

// Enable fallback to 'en' if translation not found
i18n.enableFallback = true;

export default i18n;

// Helper function for easy translation
export function t(key: string, options?: any) {
  return i18n.t(key, options);
}

