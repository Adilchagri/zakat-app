import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, 
  Alert, Animated, Dimensions, StatusBar, Modal,
  KeyboardAvoidingView, ScrollView, Platform, FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import AppGuide from '../components/AppGuide';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    subtitle: "Calculator",
    goldPrice: "Gold (USD/oz)",
    silverPrice: "Silver (USD/oz)",
    exchangeRate: "USD → MAD",
    localPriceGold: "Gold/Gram",
    localPriceSilver: "Silver/Gram",
    refresh: "Update",
    wealthLabel: "Your Wealth",
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
    progress: "Progress",
    totalPaid: "Total Paid",
    remaining: "Remaining",
    addPayment: "Add Payment",
    editPayment: "Edit Payment",
    paymentAmount: "Payment Amount",
    paymentDate: "Date",
    savePayment: "Save Payment",
    deletePayment: "Delete",
    noPayments: "No payments recorded yet",
    paymentHistory: "Payment History",
    resetYear: "Reset Year",
    confirmReset: "Reset Zakat Year?",
    confirmResetMsg: "This will delete all payment records. Continue?",
    cancel: "Cancel",
    confirm: "Confirm",
    monthlyBreakdown: "Monthly Breakdown",
    setNewZakat: "Set Annual Zakat",
    currentYear: "Current Year",
    updateZakat: "Update Zakat Amount"
  },
  ar: {
    title: "الزكاة",
    subtitle: "حاسبة",
    goldPrice: "الذهب",
    silverPrice: "الفضة",
    exchangeRate: "دولار ← درهم",
    localPriceGold: "الذهب/جرام",
    localPriceSilver: "الفضة/جرام",
    refresh: "تحديث",
    wealthLabel: "مالك",
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
    progress: "التقدم",
    totalPaid: "المدفوع",
    remaining: "المتبقي",
    addPayment: "إضافة دفعة",
    editPayment: "تعديل الدفعة",
    paymentAmount: "المبلغ",
    paymentDate: "التاريخ",
    savePayment: "حفظ",
    deletePayment: "حذف",
    noPayments: "لا توجد مدفوعات مسجلة",
    paymentHistory: "سجل المدفوعات",
    resetYear: "إعادة تعيين السنة",
    confirmReset: "إعادة تعيين سنة الزكاة؟",
    confirmResetMsg: "سيتم حذف جميع سجلات الدفع. هل تريد المتابعة؟",
    cancel: "إلغاء",
    confirm: "تأكيد",
    monthlyBreakdown: "التفصيل الشهري",
    setNewZakat: "تحديد زكاة السنة",
    currentYear: "السنة الحالية",
    updateZakat: "تحديث مبلغ الزكاة"
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
    }, 5000);

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

// About Modal Component
const AboutModal = ({ visible, onClose, lang }) => {
  const t = content[lang];
  const isRTL = lang === 'ar';
  
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalIcon}>☪</Text>
            <Text style={styles.modalTitle}>Zakat Tracker</Text>
            <Text style={styles.modalSubtitle}>متتبع الزكاة</Text>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={[styles.devLabel, isRTL && styles.textRight]}>
              {t.developedBy}
            </Text>
            
            <View style={styles.devCard}>
              <Text style={styles.devName}>👨‍💻 Adil Chagri</Text>
            </View>
            
            <View style={styles.devCard}>
              <Text style={styles.devName}>👨‍💻 Chouaib Jbel</Text>
            </View>
            
            <View style={styles.devCard}>
              <Text style={styles.devName}>👨‍💻 Amine Bazaoui</Text>
            </View>
            
            <Text style={styles.versionText}>Version 2.0.0</Text>
            <Text style={styles.yearText}>© 2026</Text>
          </View>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>{t.close}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ===== NEW: PAYMENT MODAL COMPONENT =====
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
      Alert.alert(
        lang === 'ar' ? 'خطأ' : 'Error',
        lang === 'ar' ? 'الرجاء إدخال مبلغ صحيح' : 'Please enter a valid amount'
      );
      return;
    }

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
              onPress={onClose}
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

// ===== NEW: PROGRESS BAR COMPONENT =====
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

// ===== NEW: PAYMENT LIST ITEM =====
const PaymentListItem = ({ payment, onEdit, onDelete, lang }) => {
  const t = content[lang];
  const date = new Date(payment.timestamp);
  const monthNames = lang === 'ar' 
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <View style={styles.paymentItem}>
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentMonth}>
          {monthNames[date.getMonth()]} {date.getFullYear()}
        </Text>
        <Text style={styles.paymentAmount}>
          {payment.amount.toFixed(2)} {t.currency}
        </Text>
      </View>
      <View style={styles.paymentActions}>
        <TouchableOpacity onPress={() => onEdit(payment)} style={styles.editBtn}>
          <Text style={styles.actionIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(payment)} style={styles.deleteBtn}>
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function App() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
  const [lang, setLang] = useState('ar'); 
  const [showGuide, setShowGuide] = useState(false);

  // Prices
  const [goldPriceUSD, setGoldPriceUSD] = useState(null);
  const [silverPriceUSD, setSilverPriceUSD] = useState(null);
  const [exchangeRate, setExchangeRate] = useState('');
  const [rateSource, setRateSource] = useState('');
  const [localPriceGoldGram, setLocalPriceGoldGram] = useState(null);
  const [localPriceSilverGram, setLocalPriceSilverGram] = useState(null);
  
  const [nisabType, setNisabType] = useState('silver');
  const [userWealth, setUserWealth] = useState('');
  const [loading, setLoading] = useState(true);
  const [zakatResult, setZakatResult] = useState(null);
  
  // ===== NEW: TRACKING STATE =====
  const [zakatTracker, setZakatTracker] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  
  const fadeAnim = new Animated.Value(0);
  const t = content[lang];
  const isRTL = lang === 'ar';

  // ===== LOAD ZAKAT TRACKER FROM STORAGE =====
  const loadZakatTracker = async () => {
    try {
      const saved = await AsyncStorage.getItem('zakat_tracker');
      if (saved) {
        const tracker = JSON.parse(saved);
        setZakatTracker(tracker);
      }
    } catch (error) {
      console.log('Error loading tracker:', error);
    }
  };

  // ===== SAVE ZAKAT TRACKER TO STORAGE =====
  const saveZakatTracker = async (tracker) => {
    try {
      await AsyncStorage.setItem('zakat_tracker', JSON.stringify(tracker));
      setZakatTracker(tracker);
    } catch (error) {
      console.log('Error saving tracker:', error);
    }
  };

  // ===== SET NEW ZAKAT YEAR =====
  const setNewZakatYear = (totalZakat) => {
    const newTracker = {
      totalZakat: parseFloat(totalZakat),
      payments: [],
      year: new Date().getFullYear(),
      createdAt: Date.now(),
    };
    saveZakatTracker(newTracker);
  };

  // ===== ADD/EDIT PAYMENT =====
  const handleSavePayment = (payment) => {
    if (!zakatTracker) return;

    let updatedPayments;
    if (editingPayment) {
      // Edit existing
      updatedPayments = zakatTracker.payments.map(p => 
        p.id === editingPayment.id ? payment : p
      );
    } else {
      // Add new
      updatedPayments = [...zakatTracker.payments, payment];
    }

    const updatedTracker = {
      ...zakatTracker,
      payments: updatedPayments
    };

    saveZakatTracker(updatedTracker);
    setShowPaymentModal(false);
    setEditingPayment(null);
  };

  // ===== DELETE PAYMENT =====
  const handleDeletePayment = (payment) => {
    Alert.alert(
      lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete',
      lang === 'ar' ? 'هل تريد حذف هذه الدفعة؟' : 'Delete this payment?',
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.deletePayment,
          style: 'destructive',
          onPress: () => {
            const updatedPayments = zakatTracker.payments.filter(p => p.id !== payment.id);
            const updatedTracker = {
              ...zakatTracker,
              payments: updatedPayments
            };
            saveZakatTracker(updatedTracker);
          }
        }
      ]
    );
  };

  // ===== RESET YEAR =====
  const handleResetYear = () => {
    Alert.alert(
      t.confirmReset,
      t.confirmResetMsg,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.confirm,
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('zakat_tracker');
            setZakatTracker(null);
            setZakatResult(null);
          }
        }
      ]
    );
  };

  // Calculate total paid and remaining
  const getTotalPaid = () => {
    if (!zakatTracker) return 0;
    return zakatTracker.payments.reduce((sum, p) => sum + p.amount, 0);
  };

  const getRemaining = () => {
    if (!zakatTracker) return 0;
    return Math.max(0, zakatTracker.totalZakat - getTotalPaid());
  };

  const getProgress = () => {
    if (!zakatTracker || zakatTracker.totalZakat === 0) return 0;
    return Math.min(100, (getTotalPaid() / zakatTracker.totalZakat) * 100);
  };

  // Backend functions (unchanged)
  const fetchBankAlMaghribRate = async () => {
    try {
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
      const seen = await AsyncStorage.getItem('has_seen_guide');
      if (!seen) setShowGuide(true);
    } catch (e) {
      console.log('Guide storage error', e);
    }
  };

  const updateLocalPrices = (goldPrice, silverPrice, rate) => {
    if (goldPrice && rate && !isNaN(rate) && rate > 0) {
      const goldGramPrice = (goldPrice * rate) / 31.1035;
      setLocalPriceGoldGram(goldGramPrice.toFixed(2));
    }
    if (silverPrice && rate && !isNaN(rate) && rate > 0) {
      const silverGramPrice = (silverPrice * rate) / 31.1035;
      setLocalPriceSilverGram(silverGramPrice.toFixed(2));
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
      loadZakatTracker();
    }
  }, [showSplash]);

  const calculateZakat = () => {
    const wealth = parseFloat(userWealth);
    const goldPrice = parseFloat(localPriceGoldGram);
    const silverPrice = parseFloat(localPriceSilverGram);

    if (isNaN(wealth) || wealth <= 0) {
      Alert.alert(
        lang === 'ar' ? 'خطأ' : 'Error',
        lang === 'ar' ? 'الرجاء إدخال مبلغ صحيح' : 'Please enter a valid amount'
      );
      return;
    }

    if (isNaN(goldPrice) || isNaN(silverPrice)) {
      Alert.alert(
        lang === 'ar' ? 'خطأ' : 'Error',
        lang === 'ar' ? 'الرجاء تحديث الأسعار' : 'Please update prices'
      );
      return;
    }

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

    if (wealth >= nisabValue) {
      const zakatAmount = (wealth * ZAKAT_RATE).toFixed(2);
      setZakatResult({
        payable: true,
        amount: zakatAmount,
        nisab: nisabValue.toFixed(2),
        nisabUsed,
      });

      // Auto-create tracker if it doesn't exist
      if (!zakatTracker) {
        setNewZakatYear(zakatAmount);
      }
    } else {
      setZakatResult({
        payable: false,
        nisab: nisabValue.toFixed(2),
        diff: (nisabValue - wealth).toFixed(2),
        nisabUsed,
      });
    }
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

          <AboutModal visible={showAbout} onClose={() => setShowAbout(false)} lang={lang} />
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

          <View style={styles.mainContent}>
          
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Text style={styles.titleIcon}>☪</Text>
                <View>
                  <Text style={styles.title}>{t.title}</Text>
                  <Text style={styles.subtitle}>{t.subtitle}</Text>
                </View>
              </View>
              
              <View style={styles.headerButtons}>
                <TouchableOpacity 
                  onPress={() => setShowGuide(true)} 
                  style={styles.aboutBtn}
                >
                  <Text style={styles.aboutText}>🎓</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => router.push('/history')} 
                  style={styles.aboutBtn}
                >
                  <Text style={styles.aboutText}>📜</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setShowAbout(true)} 
                  style={styles.aboutBtn}
                >
                  <Text style={styles.aboutText}>ℹ️</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setLang(lang === 'en' ? 'ar' : 'en')} 
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
                  onPress={() => setNisabType('silver')}
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
                  onPress={() => setNisabType('gold')}
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
                  onPress={() => setNisabType('both')}
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
            <View style={styles.cardsGrid}>
              
              {/* Left Column */}
              <View style={styles.leftColumn}>
                
                {/* Gold Price Card */}
                <View style={[styles.card3D, styles.goldCard]}>
                  <Text style={styles.cardLabel}>{t.goldPrice}</Text>
                  {loading ? (
                    <ActivityIndicator size="small" color="#C9A961" />
                  ) : (
                    <>
                      <Text style={styles.cardValue}>${goldPriceUSD?.toFixed(0)}</Text>
                      <Text style={styles.cardSubvalue}>{localPriceGoldGram} {t.currency}/g</Text>
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
                      <Text style={styles.cardValue}>${silverPriceUSD?.toFixed(2)}</Text>
                      <Text style={styles.cardSubvalue}>{localPriceSilverGram} {t.currency}/g</Text>
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
                      style={styles.rateInput} 
                      value={exchangeRate}
                      keyboardType="decimal-pad"
                      onChangeText={handleRateChange}
                      placeholder="9.09"
                    />
                  </View>
                </View>

                {/* Update Button */}
                <TouchableOpacity 
                  onPress={() => {
                    setRateSource('');
                    fetchAllPrices();
                  }} 
                  style={styles.updateBtn3D}
                  disabled={loading}
                >
                  <Text style={styles.updateText}>🔄</Text>
                </TouchableOpacity>

              </View>

              {/* Right Column */}
              <View style={styles.rightColumn}>
                
                {/* Wealth Input Card */}
                <View style={[styles.card3D, styles.wealthCard]}>
                  <Text style={styles.cardLabelLarge}>{t.wealthLabel}</Text>
                  <TextInput 
                    style={styles.wealthInput} 
                    placeholder={t.wealthPlaceholder}
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                    value={userWealth}
                    onChangeText={setUserWealth}
                  />
                  
                  <TouchableOpacity 
                    style={[styles.calcBtn3D, (!localPriceGoldGram || !localPriceSilverGram || !userWealth) && styles.calcBtnDisabled]} 
                    onPress={calculateZakat}
                    disabled={!localPriceGoldGram || !localPriceSilverGram || !userWealth}
                  >
                    <Text style={styles.calcBtnText}>{t.calculateBtn}</Text>
                  </TouchableOpacity>
                </View>

                {/* ===== NEW: TRACKING RESULT CARD ===== */}
                {zakatResult && zakatResult.payable && zakatTracker && (
                  <View style={[styles.card3D, styles.trackingCard]}>
                    <View style={styles.trackingHeader}>
                      <Text style={styles.trackingTitle}>📊 {t.progress}</Text>
                      <TouchableOpacity 
                        onPress={handleResetYear}
                        style={styles.resetBtn}
                      >
                        <Text style={styles.resetBtnText}>🔄</Text>
                      </TouchableOpacity>
                    </View>

                    <ProgressBar progress={getProgress()} lang={lang} />

                    <View style={styles.trackingStats}>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>{t.totalPaid}</Text>
                        <Text style={styles.statValue}>
                          {getTotalPaid().toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>{t.remaining}</Text>
                        <Text style={[styles.statValue, styles.remainingValue]}>
                          {getRemaining().toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity 
                      style={styles.addPaymentBtn}
                      onPress={() => setShowPaymentModal(true)}
                    >
                      <Text style={styles.addPaymentText}>➕ {t.addPayment}</Text>
                    </TouchableOpacity>

                    {/* Payment List */}
                    {zakatTracker.payments.length > 0 && (
                      <View style={styles.paymentList}>
                        <Text style={styles.paymentListTitle}>{t.paymentHistory}</Text>
                        {zakatTracker.payments
                          .sort((a, b) => b.timestamp - a.timestamp)
                          .slice(0, 3)
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

                {/* Original Result Card (when not tracking or below nisab) */}
                {zakatResult && (!zakatTracker || !zakatResult.payable) && (
                  <View style={[
                    styles.card3D, 
                    styles.resultCard,
                    zakatResult.payable ? styles.resultGreen : styles.resultAmber
                  ]}>
                    <View style={styles.resultHeader}>
                      <Text style={styles.resultIcon}>
                        {zakatResult.payable ? '✓' : '○'}
                      </Text>
                      <Text style={styles.resultTitle}>
                        {zakatResult.payable ? t.resultDue : t.resultNotDue}
                      </Text>
                    </View>

                    <View style={styles.nisabRow}>
                      <Text style={styles.nisabLabel}>{t.nisabLabel}:</Text>
                      <Text style={styles.nisabValue}>{zakatResult.nisab}</Text>
                    </View>
                    
                    <Text style={styles.nisabUsedText}>
                      {lang === 'ar' ? 'بناءً على' : 'Based on'}: {zakatResult.nisabUsed}
                    </Text>

                    {zakatResult.payable ? (
                      <View style={styles.amountBox}>
                        <Text style={styles.amountLabel}>{t.amountDue}</Text>
                        <Text style={styles.amountValue}>{zakatResult.amount}</Text>
                        <Text style={styles.amountCurrency}>{t.currency}</Text>
                      </View>
                    ) : (
                      <View style={styles.diffBox}>
                        <Text style={styles.diffLabel}>{t.diffLabel}</Text>
                        <Text style={styles.diffValue}>{zakatResult.diff} {t.currency}</Text>
                      </View>
                    )}

                    {zakatResult.payable && !zakatTracker && (
                      <TouchableOpacity 
                        style={styles.startTrackingBtn}
                        onPress={() => setNewZakatYear(zakatResult.amount)}
                      >
                        <Text style={styles.startTrackingText}>
                          🎯 {t.setNewZakat}
                        </Text>
                      </TouchableOpacity>
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
    backgroundColor:  '#C9A96115',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 97, 0.3)',
  },
  nisabSelectorLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#C9A961',
    marginBottom: 8,
    textAlign: 'center',
  },
  nisabButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  nisabBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  nisabBtnActive: {
    backgroundColor: '#1a4d2e',
    borderColor: '#C9A961',
  },
  nisabBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#666',
  },
  nisabBtnTextActive: {
    color: '#C9A961',
  },
  recommendedText: {
    fontSize: 8,
    color: '#C9A961',
    marginTop: 2,
  },
  
  silverCard: {
    backgroundColor: '#F5F5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#999999',
  },
  
  cardSubvalue: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  
  nisabUsedText: {
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
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
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    fontSize: 36,
    color: '#C9A961',
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#C9A961',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#E8D7B5',
    letterSpacing: 1.5,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  aboutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(201, 169, 97, 0.2)',
    borderWidth: 2,
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
    backgroundColor: 'rgba(201, 169, 97, 0.2)',
    borderWidth: 2,
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
    backgroundColor: '#C9A96125',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#C9A961',
    borderLeftWidth: 4,
    borderLeftColor: '#C9A961',
    shadowColor: '#C9A961',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
    gap: 4,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(201, 169, 97, 0.3)',
  },
  indicatorActive: {
    backgroundColor: '#C9A961',
    width: 16,
  },
  quoteTextAr: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C9A961',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 26,
  },
  quoteTextEn: {
    fontSize: 12,
    color: '#E8D7B5',
    textAlign: 'center',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  quoteReference: {
    fontSize: 10,
    color: 'rgba(232, 215, 181, 0.7)',
    textAlign: 'center',
    fontWeight: '600',
  },

  cardsGrid: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 5,
  },

  leftColumn: {
    flex: 1,
    gap: 10,
  },
  rightColumn: {
    flex: 1.3,
    gap: 10,
  },

  card3D: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 97, 0.3)',
    transform: [{ perspective: 1000 }],
  },

  goldCard: {
    backgroundColor: '#FFFAF0',
    borderLeftWidth: 4,
    borderLeftColor: '#C9A961',
  },
  rateCard: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  wealthCard: {
    backgroundColor: '#E6F7EB',
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
    flex: 1,
  },
  resultCard: {
    minHeight: 190,
  },
  resultGreen: {
    backgroundColor:'#E6F7EB',
    borderLeftWidth: 5,
    borderLeftColor: '#1a4d2e',
  },
  resultAmber: {
    backgroundColor: '#FFF8E6',
    borderLeftWidth: 5,
    borderLeftColor: '#C9A961',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardLabelLarge: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1a4d2e',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
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
    marginTop: 6,
  },
  rateInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: 'rgba(25, 118, 210, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1976D2',
  },

  updateBtn3D: {
    backgroundColor: '#C9A961',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C9A961',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
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
    marginBottom: 12,
  },
  resultIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a4d2e',
  },
  nisabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  nisabLabel: {
    fontSize: 11,
    color: '#666',
  },
  nisabValue: {
    fontSize: 13,
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
    backgroundColor: 'rgba(201, 169, 97, 0.1)',
    padding: 14,
    borderRadius: 12,
  },
  diffLabel: {
    fontSize: 10,
    color: '#8B4513',
    marginBottom: 6,
  },
  diffValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
  },

  footer: {
    alignItems: 'center',
    marginTop: 10,
  },
  footerText: {
    fontSize: 10,
    color: '#E8D7B5',
    letterSpacing: 0.8,
  },

  textRight: {
    textAlign: 'right',
  },

  // ===== NEW TRACKING STYLES =====
  trackingCard: {
    backgroundColor: 'rgba(230, 247, 235, 0.98)',
    borderLeftWidth: 5,
    borderLeftColor: '#1a4d2e',
    minHeight: 300,
  },
  
  trackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  trackingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a4d2e',
  },
  
  resetBtn: {
    padding: 6,
  },
  
  resetBtnText: {
    fontSize: 18,
  },
  
  progressContainer: {
    marginBottom: 20,
  },
  
  progressBarBg: {
    height: 20,
    backgroundColor: 'rgba(26, 77, 46, 0.1)',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1a4d2e',
    borderRadius: 10,
  },
  
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a4d2e',
    textAlign: 'center',
  },
  
  trackingStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(26, 77, 46, 0.2)',
    marginHorizontal: 10,
  },
  
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 6,
  },
  
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a4d2e',
  },
  
  remainingValue: {
    color: '#C9A961',
  },
  
  addPaymentBtn: {
    backgroundColor: '#1a4d2e',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#1a4d2e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  
  addPaymentText: {
    color: '#C9A961',
    fontSize: 15,
    fontWeight: 'bold',
  },
  
  paymentList: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    padding: 12,
  },
  
  paymentListTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a4d2e',
    marginBottom: 10,
  },
  
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#C9A961',
  },
  
  paymentInfo: {
    flex: 1,
  },
  
  paymentMonth: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  
  paymentAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a4d2e',
  },
  
  paymentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  
  editBtn: {
    padding: 6,
  },
  
  deleteBtn: {
    padding: 6,
  },
  
  actionIcon: {
    fontSize: 16,
  },

  // Payment Modal Styles
  paymentModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
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
    marginBottom: 8,
  },
  
  paymentInput: {
    backgroundColor: 'rgba(26, 77, 46, 0.05)',
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    borderWidth: 2,
    borderColor: '#1a4d2e',
  },
  
  dateDisplay: {
    backgroundColor: 'rgba(26, 77, 46, 0.05)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 2,
    borderColor: '#1a4d2e',
    textAlign: 'center',
  },
  
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  saveButton: {
    backgroundColor: '#D4AF37',
  },
  
  saveButtonText: {
    color: '#1a4d2e',
    fontSize: 16,
    fontWeight: 'bold',
  },

  startTrackingBtn: {
    backgroundColor: '#1a4d2e',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  
  startTrackingText: {
    color: '#C9A961',
    fontSize: 15,
    fontWeight: 'bold',
  },

  rtlContainer: {
    direction: 'rtl',
  },
});