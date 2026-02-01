import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator,
  Alert, Animated, Dimensions, StatusBar, Modal,
  KeyboardAvoidingView, ScrollView, Platform, FlatList, LayoutAnimation, UIManager
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AppGuide from '../components/AppGuide';
import PrivacyModal from '../components/PrivacyModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useZakatData } from '../hooks/useZakatData';
import WealthDetailModal from '../components/WealthDetailModal';
import * as Haptics from 'expo-haptics';
import { moderateScale } from '../utils/scale';


// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// --- CONFIGURATION ---
const NISAB_GRAMS = 85;
const ZAKAT_RATE = 0.025;
const NISAB_SILVER_GRAMS = 595;
const FALLBACK_USD_MAD = 10.10;

const { width, height } = Dimensions.get('window');

// --- ISLAMIC QUOTES (Maliki Madhab) ---
const islamicQuotes = [
  // --- QURANIC VERSES ---
  {
    id: 1,
    ar: "خُذْ مِنْ أَمْوَالِهِمْ صَدَقَةً تُطَهِّرُهُمْ وَتُزَكِّيهِم بِهَا",
    en: "Take, [O, Muhammad], from their wealth a charity by which you purify them and cause them increase.",
    reference: "التوبة: 103",
    refEn: "At-Tawbah: 103",
    type: "quran"
  },
  {
    id: 2,
    ar: "وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ",
    en: "And establish prayer and give zakah.",
    reference: "البقرة: 43",
    refEn: "Al-Baqarah: 43",
    type: "quran"
  },
  {
    id: 3,
    ar: "إِنَّمَا الصَّدَقَاتُ لِلْفُقَرَاءِ وَالْمَسَاكِينِ",
    en: "Zakah is only for the poor and the needy.",
    reference: "التوبة: 60",
    refEn: "At-Tawbah: 60",
    type: "quran"
  },
  {
    id: 4,
    ar: "وَمَا آتَيْتُم مِّن زَكَاةٍ تُرِيدُونَ وَجْهَ اللَّهِ فَأُولَٰئِكَ هُمُ الْمُضْعِفُونَ",
    en: "But what you give in Zakat, desiring the countenance of Allah - those are the multipliers.",
    reference: "الروم: 39",
    refEn: "Ar-Rum: 39",
    type: "quran"
  },
  {
    id: 5,
    ar: "وَالَّذِينَ فِي أَمْوَالِهِمْ حَقٌّ مَّعْلُومٌ",
    en: "And those in whose wealth is a known right.",
    reference: "المعارج: 24",
    refEn: "Al-Ma'arij: 24",
    type: "quran"
  },
  {
    id: 6,
    ar: "يَمْحَقُ اللَّهُ الرِّبَا وَيُرْبِي الصَّدَقَاتِ",
    en: "Allah destroys interest and gives increase for charities.",
    reference: "البقرة: 276",
    refEn: "Al-Baqarah: 276",
    type: "quran"
  },
  {
    id: 7,
    ar: "وَمَا أَنفَقْتُم مِّن شَيْءٍ فَهُوَ يُخْلِفُهُ ۖ وَهُوَ خَيْرُ الرَّازِقِينَ",
    en: "And whatever thing you spend [in His cause] - He will compensate it; and He is the best of providers.",
    reference: "سبأ: 39",
    refEn: "Saba: 39",
    type: "quran"
  },

  // --- SAHIH HADITH ---
  {
    id: 8,
    ar: "بُنِيَ الإِسْلَامُ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لَا إِلَهَ إِلَّا اللَّهُ... وَإِقَامِ الصَّلَاةِ، وَإِيتَاءِ الزَّكَاةِ",
    en: "Islam is built on five: Testifying that there is no god but Allah... establishing prayer, giving Zakat...",
    reference: "رواه البخاري ومسلم",
    refEn: "Bukhari & Muslim",
    type: "hadith"
  },
  {
    id: 9,
    ar: "مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ",
    en: "Charity does not decrease wealth.",
    reference: "رواه مسلم",
    refEn: "Sahih Muslim",
    type: "hadith"
  },
  {
    id: 10,
    ar: "تُؤْخَذُ مِنْ أَغْنِيَائِهِمْ فَتُرَدُّ عَلَى فُقَرَائِهِمْ",
    en: "(Zakat) is to be taken from their rich and given to their poor.",
    reference: "رواه البخاري",
    refEn: "Sahih Al-Bukhari",
    type: "hadith"
  },
  {
    id: 11,
    ar: "أَفْضَلُ الصَّدَقَةِ أَنْ تَصَدَّقَ وَأَنْتَ صَحِيحٌ شَحِيحٌ",
    en: "The best charity is that given when you are healthy and greedy (fearing poverty).",
    reference: "رواه البخاري ومسلم",
    refEn: "Bukhari & Muslim",
    type: "hadith"
  },
  {
    id: 12,
    ar: "مَنْ أَدَّى زَكَاةَ مَالِهِ فَقَدْ ذَهَبَ عَنْهُ شَرُّهُ",
    en: "Whoever pays Zakat on his wealth, its evil is removed from him.",
    reference: "رواه الحاكم (صحيح)",
    refEn: "Al-Hakim (Sahih)",
    type: "hadith"
  },
  {
    id: 13,
    ar: "الصَّدَقَةُ تُطْفِئُ الْخَطِيئَةَ كَمَا يُطْفِئُ الْمَاءُ النَّارَ",
    en: "Charity extinguishes sin as water extinguishes fire.",
    reference: "رواه الترمذي (صحيح)",
    refEn: "At-Tirmidhi (Sahih)",
    type: "hadith"
  },
  {
    id: 14,
    ar: "مَا خَالَطَتِ الزَّكَاةُ مَالًا قَطُّ إِلَّا أَهْلَكَتْهُ",
    en: "Zakat never mixes with wealth (by not being paid) except that it destroys it.",
    reference: "رواه البخاري في التاريخ",
    refEn: "Al-Bukhari (Al-Tarikh)",
    type: "hadith"
  },
  {
    id: 15,
    ar: "الْيَدُ الْعُلْيَا خَيْرٌ مِنَ الْيَدِ السُّفْلَى",
    en: "The upper hand (the giving one) is better than the lower hand (the receiving one).",
    reference: "رواه البخاري ومسلم",
    refEn: "Bukhari & Muslim",
    type: "hadith"
  },

  // --- MALIKI FIQH (RULES) ---
  {
    id: 16,
    ar: "النِّصَابُ فِي الذَّهَبِ عِشْرُونَ مِثْقَالًا (85 جرام)",
    en: "The Nisab for gold is twenty Mithqal (approx 85 grams).",
    reference: "الإمام مالك - الموطأ",
    refEn: "Imam Malik - Al-Muwatta",
    type: "maliki"
  },
  {
    id: 17,
    ar: "فِي كُلِّ عِشْرِينَ دِينَارًا نِصْفُ دِينَارٍ (2.5%)",
    en: "In every twenty dinars, half a dinar is due (2.5%).",
    reference: "رسالة ابن أبي زيد القيرواني",
    refEn: "Risalat Ibn Abi Zayd",
    type: "maliki"
  },
  {
    id: 18,
    ar: "لَا زَكَاةَ فِي مَالٍ حَتَّى يَحُولَ عَلَيْهِ الْحَوْلُ",
    en: "There is no Zakat on wealth until a lunar year has passed over it.",
    reference: "الإمام مالك",
    refEn: "Imam Malik",
    type: "maliki"
  },
  {
    id: 19,
    ar: "يُضَمُّ الذَّهَبُ إِلَى الْفِضَّةِ فِي تَكْمِيلِ النِّصَابِ",
    en: "Gold is combined with silver (or cash) to complete the Nisab threshold.",
    reference: "المدونة الكبرى",
    refEn: "Al-Mudawwana",
    type: "maliki"
  },
  {
    id: 20,
    ar: "الزَّكَاةُ وَاجِبَةٌ فِي كُلِّ مَالٍ نَامٍ أَوْ قَابِلٍ لِلنَّمَاءِ",
    en: "Zakat is obligatory on all growing wealth or wealth capable of growth.",
    reference: "المذهب المالكي",
    refEn: "Maliki School",
    type: "maliki"
  }
];

// --- TRANSLATIONS ---
const content = {
  en: {
    title: "Zakat",
    subtitle: "Tracker",
    goldPrice: "Gold (USD/oz)",
    silverPrice: "Silver (USD/oz)",
    exchangeRate: "USD → MAD",
    localPriceGold: "Gold/Gram",
    localPriceSilver: "Silver/Gram",
    refresh: "Update",
    wealthLabel: "Total Wealth",
    wealthPlaceholder: "Amount in MAD...",
    calculateBtn: "Calculate Zakat",
    resultDue: "Zakat Due",
    resultNotDue: "Below Nisab",
    nisabLabel: "Nisab",
    amountDue: "Zakat",
    diffLabel: "Needed",
    currency: "MAD",
    loading: "Loading...",
    about: "About",
    developedBy: "Developed by",
    close: "Close",
    nisabType: "Nisab Based On",
    gold: "Gold",
    silver: "Silver",
    both: "Both",
    recommended: "(Recommended)",
    // New tracking translations
    progress: "Monthly Progress",
    totalPaid: "Paid",
    remaining: "Remaining",
    addPayment: "Add Payment",
    editPayment: "Edit Payment",
    paymentAmount: "Payment Amount",
    paymentDate: "Date",
    savePayment: "Save Payment",
    deletePayment: "Delete",
    noPayments: "No payments this month",
    paymentHistory: "This Month's Payments",
    resetYear: "Reset Month",
    confirmReset: "Reset Month?",
    confirmResetMsg: "This will clear this month's data. Continue?",
    cancel: "Cancel",
    confirm: "Confirm",
    monthlyBreakdown: "Monthly Breakdown",
    setNewZakat: "Start Tracking",
    currentYear: "Current Month",
    updateZakat: "Update Zakat",
    wealthDetails: "Wealth Details",
    manageWealth: "Manage Wealth",
    addFunds: "Add Funds"
  },
  ar: {
    title: "الزكاة",
    subtitle: "تتبع",
    goldPrice: "الذهب",
    silverPrice: "الفضة",
    exchangeRate: "دولار ← درهم",
    localPriceGold: "الذهب/جرام",
    localPriceSilver: "الفضة/جرام",
    refresh: "تحديث",
    wealthLabel: "إجمالي المال",
    wealthPlaceholder: "المبلغ بالدرهم...",
    calculateBtn: "احسب الزكاة",
    resultDue: "تجب الزكاة",
    resultNotDue: "دون النصاب",
    nisabLabel: "النصاب",
    amountDue: "الزكاة",
    diffLabel: "المتبقي",
    currency: "د.م.",
    loading: "جاري التحميل...",
    about: "حول",
    developedBy: "تطوير",
    close: "إغلاق",
    nisabType: "النصاب بناءً على",
    gold: "الذهب",
    silver: "الفضة",
    both: "كلاهما",
    recommended: "(موصى به)",
    // New tracking translations
    progress: "التقدم الشهري",
    totalPaid: "المدفوع",
    remaining: "المتبقي",
    addPayment: "إضافة دفعة",
    editPayment: "تعديل الدفعة",
    paymentAmount: "المبلغ",
    paymentDate: "التاريخ",
    savePayment: "حفظ",
    deletePayment: "حذف",
    noPayments: "لا توجد مدفوعات هذا الشهر",
    paymentHistory: "مدفوعات الشهر",
    resetYear: "إعادة ضبط الشهر",
    confirmReset: "إعادة ضبط الشهر؟",
    confirmResetMsg: "سيتم حذف بيانات هذا الشهر. هل تريد المتابعة؟",
    cancel: "إلغاء",
    confirm: "تأكيد",
    monthlyBreakdown: "التفصيل الشهري",
    setNewZakat: "بدء التتبع",
    currentYear: "الشهر الحالي",
    updateZakat: "تحديث الزكاة",
    wealthDetails: "تفاصيل الأموال",
    manageWealth: "إدارة الأموال",
    addFunds: "إضافة مال"
  }
};

// Splash Screen Component
const SplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = new Animated.Value(0.3);
  const rotateAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(onFinish, 600);
    });
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.splashContainer}>
      <StatusBar hidden={true} />
      <View style={styles.splashBg}>
        <View style={styles.splashPattern} />
      </View>

      <Animated.View style={[
        styles.splashIconContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }, { rotate }]
        }
      ]}>
        <View style={styles.splashIcon}>
          <Text style={styles.splashIconText}>☪</Text>
        </View>
        <View style={styles.splashGlow} />
      </Animated.View>

      <Animated.Text style={[styles.splashTitle, { opacity: fadeAnim }]}>
        Zakat Tracker
      </Animated.Text>
      <Animated.Text style={[styles.splashSubtitle, { opacity: fadeAnim }]}>
        متتبع الزكاة
      </Animated.Text>
    </View>
  );
};

// Islamic Quote Slider Component
const IslamicQuoteSlider = ({ lang }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex((prev) => (prev + 1) % islamicQuotes.length);
        slideAnim.setValue(20);

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 8000); // Slower interval for readability

    return () => clearInterval(interval);
  }, []);

  const quote = islamicQuotes[currentIndex];
  const isRTL = lang === 'ar';

  const getTypeIcon = () => {
    switch (quote.type) {
      case 'quran': return '📖';
      case 'hadith': return '📜';
      case 'maliki': return '🕌';
      default: return '✨';
    }
  };

  return (
    <Animated.View style={[
      styles.quoteSlider,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }
    ]}>
      <View style={styles.quoteHeader}>
        <Text style={styles.quoteIcon}>{getTypeIcon()}</Text>
        <View style={styles.quoteIndicators}>
          {islamicQuotes.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.indicator,
                idx === currentIndex && styles.indicatorActive
              ]}
            />
          ))}
        </View>
      </View>

      <Text style={[styles.quoteTextAr, isRTL && styles.textRight]}>
        {quote.ar}
      </Text>

      <Text style={[styles.quoteTextEn, isRTL && styles.textRight]}>
        {lang === 'ar' ? quote.ar : quote.en}
      </Text>

      <Text style={styles.quoteReference}>
        {lang === 'ar' ? quote.reference : quote.refEn}
      </Text>
    </Animated.View>
  );
};



// ===== PAYMENT MODAL COMPONENT =====
const PaymentModal = ({ visible, onClose, onSave, lang, editingPayment }) => {
  const t = content[lang];
  const isRTL = lang === 'ar';
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    if (editingPayment) {
      setAmount(editingPayment.amount.toString());
      setDate(new Date(editingPayment.timestamp));
    } else {
      setAmount('');
      setDate(new Date());
    }
  }, [editingPayment, visible]);

  const formatDate = (d) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleSave = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        lang === 'ar' ? 'خطأ' : 'Error',
        lang === 'ar' ? 'الرجاء إدخال مبلغ صحيح' : 'Please enter a valid amount'
      );
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      amount: amt,
      date: date,
      timestamp: date.getTime(),
      id: editingPayment?.id || Date.now().toString()
    });

    setAmount('');
    setDate(new Date());
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.paymentModalContent, isRTL && styles.rtlContainer]}>
          <Text style={styles.paymentModalTitle}>
            {editingPayment ? t.editPayment : t.addPayment}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRTL && styles.textRight]}>
              {t.paymentAmount} ({t.currency})
            </Text>
            <TextInput
              style={[styles.paymentInput, isRTL && styles.textRight]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRTL && styles.textRight]}>
              {t.paymentDate}
            </Text>
            <Text style={styles.dateDisplay}>{formatDate(date)}</Text>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                Haptics.selectionAsync();
                onClose();
              }}
            >
              <Text style={styles.cancelButtonText}>{t.cancel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>{t.savePayment}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ===== PROGRESS BAR COMPONENT =====
const ProgressBar = ({ progress, lang }) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const width = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBarBg}>
        <Animated.View style={[styles.progressBarFill, { width }]} />
      </View>
      <Text style={styles.progressText}>{Math.round(progress)}%</Text>
    </View>
  );
};

// ... (imports remain the same)

// Month names
const monthNames = {
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
};

// ... (other configurations remain the same)

// ===== PAYMENT LIST ITEM =====
const PaymentListItem = ({ payment, onEdit, onDelete, lang }) => {
  const t = content[lang];
  const isRTL = lang === 'ar';

  return (
    <View style={[styles.paymentRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={styles.amountContainer}>
        <Text style={[styles.amountText, { textAlign: isRTL ? 'right' : 'left' }]}>
          {payment.amount} {t.currency}
        </Text>
      </View>
      
      <View style={[
        styles.actionsContainer, 
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
        !isRTL && { marginTop: 2 }
      ]}>
        <TouchableOpacity 
          onPress={() => {
            Haptics.selectionAsync();
            onEdit(payment);
          }} 
          style={styles.actionBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.actionIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onDelete(payment);
          }} 
          style={[styles.actionBtn, styles.deleteBtn]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function App() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [lang, setLang] = useState('ar');
  const [showGuide, setShowGuide] = useState(false);

  // Prices
  const [goldPriceUSD, setGoldPriceUSD] = useState(null);
  const [silverPriceUSD, setSilverPriceUSD] = useState(null);
  const [exchangeRate, setExchangeRate] = useState('');
  const [rateSource, setRateSource] = useState('');
  
  // Manual Override State
  const [manualGoldPrice, setManualGoldPrice] = useState(null);
  const [manualSilverPrice, setManualSilverPrice] = useState(null);

  const [localPriceGoldGram, setLocalPriceGoldGram] = useState(null);
  const [localPriceSilverGram, setLocalPriceSilverGram] = useState(null);
  const [isRateFocused, setIsRateFocused] = useState(false);

  const [nisabType, setNisabType] = useState('silver');

  // Manual Handlers
  const handleGoldManualChange = (text) => {
    if (text === '' || text === null) {
      setManualGoldPrice(null);
      if (goldPriceUSD && exchangeRate && !isNaN(exchangeRate)) {
        const val = (goldPriceUSD * parseFloat(exchangeRate)) / 31.1035;
        setLocalPriceGoldGram(val.toFixed(2));
      } else {
        setLocalPriceGoldGram(null);
      }
    } else {
      setManualGoldPrice(text);
      setLocalPriceGoldGram(text);
    }
  };

  const handleSilverManualChange = (text) => {
    if (text === '' || text === null) {
      setManualSilverPrice(null);
      if (silverPriceUSD && exchangeRate && !isNaN(exchangeRate)) {
        const val = (silverPriceUSD * parseFloat(exchangeRate)) / 31.1035;
        setLocalPriceSilverGram(val.toFixed(2));
      } else {
        setLocalPriceSilverGram(null);
      }
    } else {
      setManualSilverPrice(text);
      setLocalPriceSilverGram(text);
    }
  };
  const [loading, setLoading] = useState(true);
  const [zakatResult, setZakatResult] = useState(null);

  // ===== NEW: TRACKING STATE & HOOK =====
  const {
    currentMonthData,
    addWealthEntry,
    deleteWealthEntry,
    addPayment,
    updatePayment,
    deletePayment,
    updateZakatDue,
    resetMonth,
    refresh // Get refresh function
  } = useZakatData();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [showWealthModal, setShowWealthModal] = useState(false);

  const fadeAnim = new Animated.Value(0);
  const t = content[lang];
  const isRTL = lang === 'ar';

  // ===== TRACKING HANDLERS =====

  const handleSavePayment = async (payment) => {
    if (editingPayment) {
      await updatePayment(payment);
    } else {
      await addPayment(payment.amount, payment.date);
    }
    setShowPaymentModal(false);
    setEditingPayment(null);
  };

  const handleDeletePayment = (payment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete',
      lang === 'ar'
        ? 'هل تريد حذف هذه الدفعة؟'
        : 'Do you want to delete this payment?',
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.deletePayment,
          style: 'destructive',
          onPress: () => deletePayment(payment.id)
        }
      ]
    );
  };

  const handleAddWealth = async (amount, description) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addWealthEntry(amount, description);
    // Recalculate will be triggered by effect
  };

  const handleDeleteWealth = async (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await deleteWealthEntry(id);
  };

  const handleResetMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    console.log('Reset button clicked!');
    Alert.alert(
      t.confirmReset,
      t.confirmResetMsg,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.confirm,
          style: 'destructive',
          onPress: async () => {
            await resetMonth();
            setZakatResult(null);
          }
        }
      ]
    );
  };

  // Calculate total paid and remaining
  const getTotalPaid = () => {
    if (!currentMonthData) return 0;
    return currentMonthData.payments.reduce((sum, p) => sum + p.amount, 0);
  };

  const getRemaining = () => {
    if (!currentMonthData || !currentMonthData.totalZakatDue) return 0;
    return Math.max(0, currentMonthData.totalZakatDue - getTotalPaid());
  };

  const getProgress = () => {
    if (!currentMonthData || !currentMonthData.totalZakatDue) return 0;
    return Math.min(100, (getTotalPaid() / currentMonthData.totalZakatDue) * 100);
  };


  // ===== API FUNCTIONS (RESTORED) =====

  const fetchBankAlMaghribRate = async () => {
    try {
      // This often fails or requires paid key, keeping as try/catch placeholder structure from original
      throw new Error('Try official forex sources');
    } catch (error) {
      try {
        const response = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=MAD&source=ecb,bam');
        const data = await response.json();
        if (data && data.rates && data.rates.MAD) {
          return { rate: data.rates.MAD, source: 'BAM' };
        }
        throw new Error('Try next source');
      } catch (error2) {
        return null;
      }
    }
  };

  const fetchForexRate = async () => {
    const apis = [
      async () => {
        const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=MAD');
        const data = await response.json();
        if (data?.rates?.MAD) return data.rates.MAD;
        throw new Error('Failed');
      },
      async () => {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();
        if (data?.rates?.MAD) return data.rates.MAD;
        throw new Error('Failed');
      },
      async () => {
        const response = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json');
        const data = await response.json();
        if (data?.usd?.mad) return data.usd.mad;
        throw new Error('Failed');
      }
    ];

    for (let i = 0; i < apis.length; i++) {
      try {
        const rate = await apis[i]();
        return { rate, source: 'Forex' };
      } catch (error) {
        if (i === apis.length - 1) {
          throw new Error('All forex APIs failed');
        }
      }
    }
  };

  const fetchExchangeRate = async () => {
    try {
      const bamResult = await fetchBankAlMaghribRate();
      if (bamResult) return bamResult;

      const forexResult = await fetchForexRate();
      if (forexResult) return forexResult;

      return { rate: FALLBACK_USD_MAD, source: 'Forex' };
    } catch (error) {
      return { rate: FALLBACK_USD_MAD, source: 'Forex' };
    }
  };

  const fetchGoldPrice = async () => {
    try {
      const response = await fetch('https://api.metals.live/v1/spot/gold');
      const data = await response.json();
      if (data && data[0] && data[0].price) {
        return data[0].price;
      }
      throw new Error('Try alternative');
    } catch (error) {
      try {
        const response = await fetch('https://data-asg.goldprice.org/dbXRates/USD');
        const data = await response.json();
        if (data?.items?.[0]) return data.items[0].xauPrice;
        throw new Error('Failed');
      } catch (e) {
        return 2650;
      }
    }
  };

  const fetchSilverPrice = async () => {
    try {
      const response = await fetch('https://api.metals.live/v1/spot/silver');
      const data = await response.json();
      if (data && data[0] && data[0].price) {
        return data[0].price;
      }
      throw new Error('Try alternative');
    } catch (error) {
      try {
        const response = await fetch('https://data-asg.goldprice.org/dbXRates/USD');
        const data = await response.json();
        if (data?.items?.[0]) return data.items[0].xagPrice;
        throw new Error('Failed');
      } catch (e) {
        return 30;
      }
    }
  };

  const fetchAllPrices = async () => {
    setLoading(true);
    try {
      const [goldPrice, silverPrice, rateData] = await Promise.all([
        fetchGoldPrice(),
        fetchSilverPrice(),
        fetchExchangeRate()
      ]);

      setGoldPriceUSD(goldPrice);
      setSilverPriceUSD(silverPrice);

      if (rateSource !== 'Manual') {
        setExchangeRate(rateData.rate.toFixed(4));
        setRateSource(rateData.source);
        updateLocalPrices(goldPrice, silverPrice, rateData.rate);
      } else {
        updateLocalPrices(goldPrice, silverPrice, parseFloat(exchangeRate));
      }

      animateIn();
    } catch (error) {
      Alert.alert(
        lang === 'ar' ? 'خطأ' : 'Error',
        lang === 'ar'
          ? 'حدث خطأ في جلب الأسعار'
          : 'Error fetching prices'
      );
    } finally {
      setLoading(false);
    }
  };

  const checkFirstLaunch = async () => {
    try {
      const seenGuide = await AsyncStorage.getItem('has_seen_guide');
      if (!seenGuide) setShowGuide(true);

      const seenPrivacy = await AsyncStorage.getItem('has_seen_privacy');
      if (!seenPrivacy) setShowPrivacy(true);
    } catch (e) {
      console.log('Storage error', e);
    }
  };

  const updateLocalPrices = (goldPrice, silverPrice, rate) => {
    if (goldPrice && rate && !isNaN(rate) && rate > 0) {
      const goldGramPrice = (goldPrice * rate) / 31.1035;
      if (manualGoldPrice === null) {
        setLocalPriceGoldGram(goldGramPrice.toFixed(2));
      }
    }
    if (silverPrice && rate && !isNaN(rate) && rate > 0) {
      const silverGramPrice = (silverPrice * rate) / 31.1035;
      if (manualSilverPrice === null) {
        setLocalPriceSilverGram(silverGramPrice.toFixed(2));
      }
    }
  };

  const handleRateChange = (val) => {
    setExchangeRate(val);
    setRateSource('Manual');
    if (goldPriceUSD && silverPriceUSD && val) {
      updateLocalPrices(goldPriceUSD, silverPriceUSD, parseFloat(val));
    }
  };

  const animateIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (!showSplash) {
      fetchAllPrices();
      checkFirstLaunch();
    }
  }, [showSplash]);

  // Recalculate Zakat when Wealth changes or Prices change
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (localPriceGoldGram && localPriceSilverGram && currentMonthData.totalWealth >= 0) {
      calculateZakat();
    }
  }, [currentMonthData.totalWealth, localPriceGoldGram, localPriceSilverGram, nisabType]);

  const calculateZakat = () => {
    const wealth = currentMonthData.totalWealth;
    const goldPrice = parseFloat(localPriceGoldGram);
    const silverPrice = parseFloat(localPriceSilverGram);

    // If prices aren't loaded yet, don't run calc
    if (isNaN(goldPrice) || isNaN(silverPrice)) return;

    let nisabValue;
    let nisabUsed;

    if (nisabType === 'gold') {
      nisabValue = goldPrice * NISAB_GRAMS;
      nisabUsed = `${t.gold} (85g)`;
    } else if (nisabType === 'silver') {
      nisabValue = silverPrice * NISAB_SILVER_GRAMS;
      nisabUsed = `${t.silver} (595g)`;
    } else {
      const goldNisab = goldPrice * NISAB_GRAMS;
      const silverNisab = silverPrice * NISAB_SILVER_GRAMS;
      nisabValue = Math.min(goldNisab, silverNisab);
      nisabUsed = silverNisab < goldNisab
        ? `${t.silver} (595g)`
        : `${t.gold} (85g)`;
    }

    const payable = wealth >= nisabValue;
    const amountDue = payable ? (wealth * ZAKAT_RATE).toFixed(2) : 0;
    const diff = payable ? 0 : (nisabValue - wealth).toFixed(2);

    setZakatResult({
      payable,
      amount: amountDue,
      nisab: nisabValue.toFixed(2),
      nisabUsed,
      diff
    });

    // Update the Hook's Zakat Due state
    updateZakatDue(nisabValue, nisabType);
  };

  const getSourceBadge = () => {
    switch (rateSource) {
      case 'BAM':
        return { color: '#2E7D32', text: lang === 'ar' ? 'بنك المغرب' : 'BAM', icon: '🏦' };
      case 'Forex':
        return { color: '#1976D2', text: lang === 'ar' ? 'الفوركس' : 'Forex', icon: '🌍' };
      case 'Manual':
        return { color: '#F57C00', text: lang === 'ar' ? 'يدوي' : 'Manual', icon: '✏️' };
      default:
        return { color: '#666', text: '---', icon: '⏳' };
    }
  };

  const badge = getSourceBadge();

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <StatusBar hidden={true} />

          <View style={styles.bgPattern}>
            <View style={styles.geometricPattern} />
          </View>

          <PrivacyModal 
            visible={showPrivacy} 
            onAccept={async () => {
              await AsyncStorage.setItem('has_seen_privacy', 'true');
              setShowPrivacy(false);
            }} 
            lang={lang} 
          />

          <PaymentModal
            visible={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              setEditingPayment(null);
            }}
            onSave={handleSavePayment}
            lang={lang}
            editingPayment={editingPayment}
          />

          <WealthDetailModal
            visible={showWealthModal}
            onClose={() => setShowWealthModal(false)}
            wealthEntries={currentMonthData.wealthEntries}
            onAdd={handleAddWealth}
            onDelete={handleDeleteWealth}
            lang={lang}
            currency={t.currency}
          />

          <View style={styles.mainContent}>

            {/* Header */}
            <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.titleContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.titleIcon, { [isRTL ? 'marginLeft' : 'marginRight']: 12, marginRight: isRTL ? 0 : 12 }]}>☪</Text>
                <View>
                  <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>{t.title}</Text>
                  <Text style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t.subtitle}</Text>
                </View>
              </View>

              <View style={[styles.headerButtons, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setShowGuide(true);
                  }}
                  style={styles.aboutBtn}
                >
                  <Text style={styles.aboutText}>🎓</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push('/history');
                  }}
                  style={styles.aboutBtn}
                >
                  <Text style={styles.aboutText}>📜</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setShowPrivacy(true);
                  }}
                  style={styles.aboutBtn}
                >
                  <Text style={styles.aboutText}>ℹ️</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setLang(lang === 'en' ? 'ar' : 'en');
                  }}
                  style={styles.langBtn}
                >
                  <Text style={styles.langText}>{lang === 'en' ? 'ع' : 'EN'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <IslamicQuoteSlider lang={lang} />

            {/* Nisab Type Selector */}
            <View style={styles.nisabSelector}>
              <Text style={[styles.nisabSelectorLabel, isRTL && styles.textRight]}>
                {t.nisabType}:
              </Text>
              <View style={styles.nisabButtons}>
                <TouchableOpacity
                  style={[
                    styles.nisabBtn,
                    nisabType === 'silver' && styles.nisabBtnActive
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setNisabType('silver');
                  }}
                >
                  <Text style={[
                    styles.nisabBtnText,
                    nisabType === 'silver' && styles.nisabBtnTextActive
                  ]}>
                    {t.silver} {nisabType === 'silver' && '✓'}
                  </Text>
                  {nisabType === 'silver' && (
                    <Text style={styles.recommendedText}>{t.recommended}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.nisabBtn,
                    nisabType === 'gold' && styles.nisabBtnActive
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setNisabType('gold');
                  }}
                >
                  <Text style={[
                    styles.nisabBtnText,
                    nisabType === 'gold' && styles.nisabBtnTextActive
                  ]}>
                    {t.gold} {nisabType === 'gold' && '✓'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.nisabBtn,
                    nisabType === 'both' && styles.nisabBtnActive
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setNisabType('both');
                  }}
                >
                  <Text style={[
                    styles.nisabBtnText,
                    nisabType === 'both' && styles.nisabBtnTextActive
                  ]}>
                    {t.both} {nisabType === 'both' && '✓'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Cards Grid */}
            <View style={[styles.cardsGrid, width < 380 && { flexDirection: 'column' }]}>

              {/* Left Column (Prices) */}
              <View style={width < 380 ? { gap: 10 } : styles.leftColumn}>

                {/* Gold Price Card */}
                <View style={[styles.card3D, styles.goldCard]}>
                  <Text style={styles.cardLabel}>{t.goldPrice}</Text>
                  {loading ? (
                    <ActivityIndicator size="small" color="#C9A961" />
                  ) : (
                    <>
                      <Text style={styles.cardValue} allowFontScaling={false}>
                        ${goldPriceUSD?.toFixed(0)}
                      </Text>
                      <View style={styles.manualInputContainer}>
                        <TextInput
                          style={[
                            styles.cardSubvalueInput,
                            manualGoldPrice !== null && styles.manualInputActive
                          ]}
                          value={localPriceGoldGram ? localPriceGoldGram.toString() : ''}
                          onChangeText={handleGoldManualChange}
                          keyboardType="decimal-pad"
                          placeholder="0.00"
                          placeholderTextColor="#ccc"
                        />
                        <Text style={styles.cardSubvalueSuffix}>{t.currency}/g</Text>
                      </View>
                      {manualGoldPrice !== null && (
                         <Text style={styles.manualLabel}>{lang === 'ar' ? 'يدوي' : 'Manual'}</Text>
                      )}
                    </>
                  )}
                </View>

                {/* Silver Price Card */}
                <View style={[styles.card3D, styles.silverCard]}>
                  <Text style={styles.cardLabel}>{t.silverPrice}</Text>
                  {loading ? (
                    <ActivityIndicator size="small" color="#999" />
                  ) : (
                    <>
                      <Text style={styles.cardValue} adjustsFontSizeToFit numberOfLines={1}>
                        ${silverPriceUSD?.toFixed(2)}
                      </Text>
                      <View style={styles.manualInputContainer}>
                        <TextInput
                          style={[
                            styles.cardSubvalueInput,
                            manualSilverPrice !== null && styles.manualInputActive
                          ]}
                          value={localPriceSilverGram ? localPriceSilverGram.toString() : ''}
                          onChangeText={handleSilverManualChange}
                          keyboardType="decimal-pad"
                          placeholder="0.00"
                          placeholderTextColor="#ccc"
                        />
                        <Text style={styles.cardSubvalueSuffix}>{t.currency}/g</Text>
                      </View>
                      {manualSilverPrice !== null && (
                         <Text style={styles.manualLabel}>{lang === 'ar' ? 'يدوي' : 'Manual'}</Text>
                      )}
                    </>
                  )}
                </View>

                {/* Exchange Rate Card */}
                <View style={[styles.card3D, styles.rateCard]}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardLabel}>{t.exchangeRate}</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeIcon}>{badge.icon}</Text>
                    </View>
                  </View>
                  <View style={styles.rateInputRow}>
                    <TextInput
                      style={[
                        styles.rateInput, 
                        isRateFocused && styles.rateInputFocused
                      ]}
                      value={exchangeRate}
                      keyboardType="decimal-pad"
                      onFocus={() => setIsRateFocused(true)}
                      onBlur={() => setIsRateFocused(false)}
                      onChangeText={handleRateChange}
                      placeholder="9.09"
                    />
                  </View>
                </View>

                {/* Update Button */}
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setRateSource('');
                    fetchAllPrices();
                  }}
                  style={styles.updateBtn3D}
                  disabled={loading}
                >
                  <Text style={styles.updateText}>🔄</Text>
                </TouchableOpacity>

              </View>

              {/* Right Column (Wealth & Results) */}
              <View style={width < 380 ? { gap: 10 } : styles.rightColumn}>

                {/* Wealth Input Card */}
                <View style={[styles.card3D, styles.wealthCard]}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardLabelLarge}>{t.wealthLabel}</Text>
                    <Text style={styles.currentMonthBadge}>
                      {(new Date()).getMonth() + 1}/{new Date().getFullYear()}
                    </Text>
                  </View>

                  <Text 
                    style={styles.totalWealthDisplay} 
                    allowFontScaling={false}
                    adjustsFontSizeToFit 
                    numberOfLines={1}
                  >
                    {currentMonthData.totalWealth.toFixed(2)} <Text style={styles.currencySmall}>{t.currency}</Text>
                  </Text>

                  <TouchableOpacity
                    style={styles.manageWealthBtn}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setShowWealthModal(true);
                    }}
                  >
                    <Text style={styles.manageWealthText}>
                      {lang === 'ar' ? '➕ إدارة / إضافة' : '➕ Manage / Add'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Result Tracking Card */}
                {zakatResult && (
                  <View style={[
                    styles.card3D,
                    zakatResult.payable ? styles.trackingCard : styles.resultCard,
                    !zakatResult.payable && styles.resultAmber
                  ]}>
                    {/* ... keeping result card content exactly the same ... */}
                    {!zakatResult.payable ? (
                      // Below Nisab View
                      <View>
                        <View style={styles.resultHeader}>
                          <Text style={styles.resultIcon}>○</Text>
                          <Text style={styles.resultTitle}>{t.resultNotDue}</Text>
                        </View>
                        <View style={styles.nisabRow}>
                          <Text style={styles.nisabLabel}>{t.nisabLabel}:</Text>
                          <Text style={styles.nisabValue}>{zakatResult.nisab}</Text>
                        </View>
                        <Text style={styles.nisabUsedText}>
                          {lang === 'ar' ? 'بناءً على' : 'Based on'}: {zakatResult.nisabUsed}
                        </Text>
                        <View style={styles.diffBox}>
                          <Text style={styles.diffLabel}>{t.diffLabel}</Text>
                          <Text style={styles.diffValue}>{zakatResult.diff} {t.currency}</Text>
                        </View>
                      </View>
                    ) : (
                      // Payable View with Tracking
                      <View>
                        <View style={styles.trackingHeader}>
                          <View>
                            <Text style={styles.trackingTitle}>📊 {t.progress}</Text>
                            <Text style={styles.currentMonthText}>
                              {monthNames[lang][new Date().getMonth()]} {new Date().getFullYear()}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={handleResetMonth}
                            style={[styles.resetBtn, !isRTL && { marginTop: 2 }]}
                            activeOpacity={0.7}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Text style={styles.resetBtnText}>🗑️</Text>
                          </TouchableOpacity>
                        </View>

                        <ProgressBar progress={getProgress()} lang={lang} />

                        <View style={styles.trackingStats}>
                          <View style={styles.statItem}>
                            <Text style={styles.statLabel}>{t.amountDue}</Text>
                            <Text style={styles.statValue} adjustsFontSizeToFit numberOfLines={1}>
                              {currentMonthData.totalZakatDue?.toFixed(2)}
                            </Text>
                          </View>
                          <View style={styles.statDivider} />
                          <View style={styles.statItem}>
                            <Text style={styles.statLabel}>{t.totalPaid}</Text>
                            <Text 
                              style={[
                                styles.statValue, 
                                { color: currentMonthData.isManualTotal ? '#2E86DE' : '#1a4d2e' }
                              ]} 
                              adjustsFontSizeToFit 
                              numberOfLines={1}
                            >
                              {getTotalPaid().toFixed(2)}
                            </Text>
                          </View>
                          <View style={styles.statDivider} />
                          <View style={styles.statItem}>
                            <Text style={styles.statLabel}>{t.remaining}</Text>
                            <Text style={[styles.statValue, styles.remainingValue]} adjustsFontSizeToFit numberOfLines={1}>
                              {getRemaining().toFixed(2)}
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={styles.addPaymentBtn}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setShowPaymentModal(true);
                          }}
                        >
                          <Text style={styles.addPaymentText}>➕ {t.addPayment}</Text>
                        </TouchableOpacity>

                        {/* Recent Payments */}
                        {currentMonthData.payments.length > 0 && (
                          <View style={styles.paymentList}>
                            <Text style={styles.paymentListTitle}>{t.paymentHistory}</Text>
                            {currentMonthData.payments
                              .slice(0, 2)
                              .map((payment) => (
                                <PaymentListItem
                                  key={payment.id}
                                  payment={payment}
                                  onEdit={(p) => {
                                    setEditingPayment(p);
                                    setShowPaymentModal(true);
                                  }}
                                  onDelete={handleDeletePayment}
                                  lang={lang}
                                />
                              ))
                            }
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}

              </View>

            </View>


            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {lang === 'ar' ? 'ذهب: 85g • فضة: 595g • الزكاة: 2.5%' : 'Gold: 85g • Silver: 595g • Zakat: 2.5%'}
              </Text>
            </View>

          </View>

          {showGuide && (
            <AppGuide
              lang={lang}
              onFinish={async () => {
                await AsyncStorage.setItem('has_seen_guide', 'true');
                setShowGuide(false);
              }}
            />
          )}

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // ... (keeping all existing styles)

  // NEW Styles for Nisab Selector
  nisabSelector: {
    backgroundColor: '#fff',
    borderRadius: 16, // More rounded
    padding: 14,
    marginBottom: 16,
    // Removed border, added shadow instead for cleaner look
    shadowColor: '#C9A961',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  nisabSelectorLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#C9A961',
    marginBottom: 10,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nisabButtons: {
    flexDirection: 'row',
    gap: 10, // Increased gap
  },
  nisabBtn: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Softer grey
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent', // Cleaner default state
    alignItems: 'center',
  },
  nisabBtnActive: {
    backgroundColor: '#1a4d2e',
    borderColor: '#1a4d2e',
  },
  nisabBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  nisabBtnTextActive: {
    color: '#C9A961',
    fontWeight: 'bold',
  },
  recommendedText: {
    fontSize: 9,
    color: '#C9A961',
    marginTop: 4,
    fontWeight: 'bold',
  },

  silverCard: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#A0A0A0', // Softer silver
  },

  cardSubvalue: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    fontWeight: '500',
  },

  // Manual Override Styles
  manualInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cardSubvalueInput: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 2,
    minWidth: 50,
    textAlign: 'left',
  },
  manualInputActive: {
    color: '#C9A961',
    borderBottomColor: '#C9A961',
    fontWeight: 'bold',
  },
  cardSubvalueSuffix: {
    fontSize: 11,
    color: '#888',
    marginLeft: 4,
  },
  manualLabel: {
    fontSize: 9,
    color: '#C9A961',
    marginTop: 2,
    fontWeight: 'bold',
  },

  nisabUsedText: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },

  // Splash Screen
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a2818',
  },
  splashBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a2818',
  },
  splashPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
    backgroundColor: 'transparent',
  },
  splashIconContainer: {
    position: 'relative',
    marginBottom: 40,
  },
  splashIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(201, 169, 97, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#C9A961',
    shadowColor: '#C9A961',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },
  splashIconText: {
    fontSize: 80,
    color: '#C9A961',
  },
  splashGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#C9A961',
    opacity: 0.15,
    top: -20,
    left: -20,
  },
  splashTitle: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#C9A961',
    letterSpacing: 2,
    marginBottom: 8,
  },
  splashSubtitle: {
    fontSize: 32,
    color: '#E8D7B5',
    letterSpacing: 1,
  },

  container: {
    flex: 1,
    backgroundColor: '#0a2818',
  },
  bgPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
  },
  geometricPattern: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  mainContent: {
    flex: 1,
    paddingHorizontal: 20, // Increased horizontal padding
    paddingTop: 60,
    paddingBottom: 30,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    fontSize: 36,
    color: '#C9A961',
    marginRight: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#C9A961',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#E8D7B5',
    letterSpacing: 1.5,
    opacity: 0.8,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  aboutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(201, 169, 97, 0.15)',
    borderWidth: 1.5,
    borderColor: '#C9A961',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutText: {
    fontSize: 20,
  },
  langBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(201, 169, 97, 0.15)',
    borderWidth: 1.5,
    borderColor: '#C9A961',
    justifyContent: 'center',
    alignItems: 'center',
  },
  langText: {
    color: '#C9A961',
    fontWeight: 'bold',
    fontSize: 14,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 30,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 3,
    borderColor: '#C9A961',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  modalIcon: {
    fontSize: 60,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a4d2e',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 24,
    color: '#C9A961',
  },
  modalBody: {
    marginBottom: 24,
  },
  devLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a4d2e',
    marginBottom: 16,
    textAlign: 'center',
  },
  devCard: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1a4d2e',
  },
  devName: {
    fontSize: 16,
    color: '#1a4d2e',
    fontWeight: '600',
    textAlign: 'center',
  },
  versionText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginTop: 20,
  },
  yearText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  closeButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#1a4d2e',
    fontSize: 16,
    fontWeight: 'bold',
  },

  quoteSlider: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // cleaner look
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 97, 0.3)',
    // Removed distracting strong borderLeft
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quoteIcon: {
    fontSize: 20,
  },
  quoteIndicators: {
    flexDirection: 'row',
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(201, 169, 97, 0.3)',
  },
  indicatorActive: {
    backgroundColor: '#C9A961',
    width: 20, // wider active indicator
  },
  quoteTextAr: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#C9A961',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 28,
  },
  quoteTextEn: {
    fontSize: 13,
    color: '#E8D7B5',
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  quoteReference: {
    fontSize: 11,
    color: 'rgba(232, 215, 181, 0.6)',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 4,
  },

  cardsGrid: {
    flex: 1,
    flexDirection: 'row',
    gap: 16, // Increased gap for breathability
    marginBottom: 10,
  },

  leftColumn: {
    flex: 1,
    gap: 16,
  },
  rightColumn: {
    flex: 1.3,
    gap: 16,
  },

  card3D: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24, // Smoother corners
    padding: 16,
    // Softer shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    // Removed explicit border to look cleaner
  },

  goldCard: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#C9A961',
  },
  rateCard: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  wealthCard: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
    flex: 1,
  },
  resultCard: {
    minHeight: 200,
  },
  resultGreen: {
    backgroundColor: '#F1F8E9', // Very light green tint
    borderLeftWidth: 5,
    borderLeftColor: '#1a4d2e',
  },
  resultAmber: {
    backgroundColor: '#FFF8E1', // Very light amber tint
    borderLeftWidth: 5,
    borderLeftColor: '#C9A961',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardLabelLarge: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a4d2e',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: moderateScale(22),
    fontWeight: 'bold',
    color: '#333',
    marginTop: 6,
  },

  badge: {
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeIcon: {
    fontSize: 14,
  },

  rateInputRow: {
    marginTop: 8,
  },
  rateInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rateInputFocused: {
    borderColor: '#C9A961',
    backgroundColor: '#fff',
  },

  updateBtn3D: {
    backgroundColor: '#C9A961',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C9A961',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  updateText: {
    fontSize: 22,
  },

  wealthInput: {
    backgroundColor: 'rgba(46, 125, 50, 0.08)',
    borderRadius: 12,
    padding: 14,
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    borderWidth: 2,
    borderColor: '#2E7D32',
    marginBottom: 12,
  },

  calcBtn3D: {
    backgroundColor: '#D4AF37',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  calcBtnDisabled: {
    opacity: 0.4,
  },
  calcBtnText: {
    color: '#1a4d2e',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a4d2e',
  },
  nisabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  nisabLabel: {
    fontSize: 12,
    color: '#666',
  },
  nisabValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  amountBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(26, 77, 46, 0.08)',
    padding: 16,
    borderRadius: 12,
  },
  amountLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 6,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a4d2e',
  },
  amountCurrency: {
    fontSize: 13,
    color: '#1a4d2e',
    marginTop: 2,
  },
  diffBox: {
    alignItems: 'center',
    padding: 14,
    backgroundColor: 'rgba(201, 169, 97, 0.1)',
    borderRadius: 12,
    marginTop: 8,
  },
  diffLabel: {
    fontSize: 11,
    color: '#C9A961',
    fontWeight: '600',
    marginBottom: 4,
  },
  diffValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C9A961',
  },

  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
  },

  // ===== NEW STYLES =====
  currentMonthBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a4d2e',
    backgroundColor: 'rgba(26, 77, 46, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  totalWealthDisplay: {
    fontSize: moderateScale(28),
    fontWeight: 'bold',
    color: '#1a4d2e',
    marginVertical: 12,
    textAlign: 'center',
  },
  currencySmall: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#666',
  },
  manageWealthBtn: {
    backgroundColor: '#1a4d2e',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#1a4d2e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  manageWealthText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  trackingCard: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 5,
    borderLeftColor: '#1a4d2e',
  },
  trackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    zIndex: 100,
    position: 'relative',
  },
  trackingTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a4d2e',
  },
  currentMonthText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    fontWeight: '500',
  },
  resetBtn: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E1', // lighter background
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    zIndex: 100,
    elevation: 100,
    position: 'relative',
  },
  resetBtnText: {
    fontSize: 18,
  },
  progressContainer: {
    height: 10, // slightly thicker
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: 14,
  },
  progressBarBg: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1a4d2e',
    borderRadius: 5,
  },
  progressText: {
    position: 'absolute',
    right: 0,
    top: -18,
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
  },
  trackingStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    height: '80%',
    alignSelf: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#333',
  },
  remainingValue: {
    color: '#C9A961',
  },
  addPaymentBtn: {
    backgroundColor: '#C9A961',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#C9A961',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addPaymentText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  paymentList: {
    marginTop: 6,
  },
  paymentListTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#aaa',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  amountContainer: {
    flex: 1,
    minWidth: 0,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E4D2B',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 10,
    marginStart: 12,
    flexShrink: 0,
  },
  actionBtn: {
    padding: moderateScale(6),
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    width: moderateScale(36),
    height: moderateScale(36),
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    backgroundColor: '#fff0f0',
  },
  actionIcon: {
    fontSize: moderateScale(16),
  },

  // Payment Modal Styles
  paymentModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  paymentModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a4d2e',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  paymentInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 14,
    padding: 16,
    fontSize: 20,
    borderWidth: 1,
    borderColor: '#eee',
    color: '#333',
    fontWeight: '600',
  },
  dateDisplay: {
    fontSize: 18,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 14,
    color: '#333',
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#1a4d2e',
    shadowColor: '#1a4d2e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
