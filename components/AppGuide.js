import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';

const { width, height } = Dimensions.get('window');

// 🎯 VERSION FINALE - SANS TRIANGLE SUPPLÉMENTAIRE
const OFFSET_Y = -30;
const OFFSET_X = 0;

const steps = [
  {
    key: 'quote',
    text: 'آيات قرآنية وأحاديث نبوية عن الزكاة - تتغير تلقائياً كل 5 ثواني',
    textEn: 'Quranic verses and Hadiths about Zakat - change automatically every 5 seconds',
    target: { 
      x: 16 + OFFSET_X, 
      y: 142 + OFFSET_Y,
      w: width - 32, 
      h: 120
    },
    cardPosition: 'bottom',
  },
  {
    key: 'nisab',
    text: 'اختر نوع النصاب: الفضة موصى به (أقل قيمة = زكاة أكثر للفقراء)',
    textEn: 'Choose Nisab type: Silver recommended (lower value = more Zakat for poor)',
    target: { 
      x: 16 + OFFSET_X, 
      y: 274 + OFFSET_Y,
      w: width - 32, 
      h: 92
    },
    cardPosition: 'bottom',
  },
  {
    key: 'gold',
    text: 'سعر الذهب اليوم بالدولار - يتحول تلقائياً إلى الدرهم للجرام',
    textEn: 'Today\'s gold price in USD - automatically converts to MAD per gram',
    target: { 
      x: 16 + OFFSET_X, 
      y: 375 + OFFSET_Y,
      w: (width - 44) / 2 - 6,
      h: 88 
    },
    cardPosition: 'bottom',
  },
  {
    key: 'silver',
    text: 'سعر الفضة - يُستخدم لحساب النصاب إذا اخترت الفضة',
    textEn: 'Silver price - used to calculate Nisab if you choose Silver',
    target: { 
      x: 16 + OFFSET_X, 
      y: 476 + OFFSET_Y,
      w: (width - 44) / 2 - 6, 
      h: 88 
    },
    cardPosition: 'bottom',
  },
  {
    key: 'rate',
    text: 'سعر الصرف دولار → درهم - يمكنك تعديله يدوياً',
    textEn: 'Exchange rate USD → MAD - you can edit it manually',
    target: { 
      x: 16 + OFFSET_X, 
      y: 574 + OFFSET_Y,
      w: (width - 44) / 2 - 6, 
      h: 88 
    },
    cardPosition: 'top',
  },
  {
    key: 'update',
    text: 'اضغط 🔄 لتحديث جميع الأسعار من الإنترنت',
    textEn: 'Press 🔄 to update all prices from the internet',
    target: { 
      x: 16 + OFFSET_X, 
      y: 672 + OFFSET_Y,
      w: (width - 44) / 2 - 6, 
      h: 44 
    },
    cardPosition: 'top',
  },
  {
    key: 'wealth',
    text: 'أدخل مالك الكلي بالدرهم المغربي (نقود + ذهب + فضة + استثمارات)',
    textEn: 'Enter your total wealth in MAD (cash + gold + silver + investments)',
    target: { 
      x: width / 2.3 + 6 + OFFSET_X, 
      y: 378 + OFFSET_Y,
      w: (width - 44) / 2 + 10,
      h: 100
    },
    cardPosition: 'bottom',
  },
  {
    key: 'calculate',
    text: 'اضغط "احسب الزكاة" لمعرفة المبلغ الواجب عليك',
    textEn: 'Press "Calculate Zakat" to know the amount due',
    target: { 
      x: width / 2 + 10 + OFFSET_X, 
      y: 480 + OFFSET_Y,
      w: (width - 44) / 2 - 20, 
      h: 52 
    },
    cardPosition: 'top',
  },
  {
    key: 'result',
    text: 'النتيجة ستظهر هنا: النصاب، الزكاة الواجبة، أو المبلغ المتبقي',
    textEn: 'Results will appear here: Nisab, Zakat due, or remaining amount',
    target: { 
      x: width / 2 + 6 + OFFSET_X, 
      y: 595 + OFFSET_Y,
      w: (width - 44) / 2 + 10, 
      h: 250
    },
    cardPosition: 'top',
  },
  {
    key: 'buttons',
    text: 'أزرار التحكم: الدليل 🎓، السجل 📜، المعلومات ℹ️، واللغة EN/ع',
    textEn: 'Control buttons: Guide 🎓, History 📜, Info ℹ️, and Language EN/ع',
    target: { 
      x: width - 200 + OFFSET_X, 
      y: 80 + OFFSET_Y,
      w: 184,
      h: 44 
    },
    cardPosition: 'bottom',
  },
];

export default function AppGuide({ onFinish, lang = 'ar' }) {
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  const current = steps[step];
  const isRTL = lang === 'ar';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, [step]);

  const handleNext = () => {
    if (step === steps.length - 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => onFinish());
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: current.cardPosition === 'top' ? -30 : 30,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setStep(step + 1);
        fadeAnim.setValue(0);
        slideAnim.setValue(steps[step + 1]?.cardPosition === 'top' ? -30 : 30);
      });
    }
  };

  const handleSkip = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onFinish());
  };

  const cardStyle = current.cardPosition === 'top' 
    ? { top: 20, bottom: undefined }
    : { bottom: 20, top: undefined };

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Dark Background */}
      <Animated.View 
        style={[styles.darkOverlay, { opacity: fadeAnim }]} 
        pointerEvents="none"
      />

      {/* Spotlight Glow */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.spotlightGlow,
          {
            left: current.target.x - 8,
            top: current.target.y - 8,
            width: current.target.w + 16,
            height: current.target.h + 16,
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.4],
            }),
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      {/* Main Spotlight Border */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.spotlight,
          {
            left: current.target.x,
            top: current.target.y,
            width: current.target.w,
            height: current.target.h,
            opacity: fadeAnim,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      {/* Info Card */}
      <Animated.View 
        style={[
          styles.card,
          cardStyle,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${((step + 1) / steps.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {step + 1}/{steps.length}
          </Text>
        </View>

        {/* Progress Dots */}
        <View style={styles.dotsContainer}>
          {steps.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === step && styles.dotActive,
                idx < step && styles.dotCompleted,
              ]}
            />
          ))}
        </View>

        {/* Guide Text with Icon */}
        <View style={styles.textContainer}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepIcon}>
              {step === 0 ? '📖' : 
               step === 1 ? '⚖️' : 
               step === 2 ? '🪙' : 
               step === 3 ? '🥈' : 
               step === 4 ? '💱' : 
               step === 5 ? '🔄' : 
               step === 6 ? '💰' : 
               step === 7 ? '🧮' : 
               step === 8 ? '✅' : '🎛️'}
            </Text>
            <Text style={styles.stepLabel}>
              {isRTL ? `الخطوة ${step + 1}` : `Step ${step + 1}`}
            </Text>
          </View>
          <Text style={[styles.guideText, isRTL && styles.textRTL]}>
            {isRTL ? current.text : current.textEn}
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>
              {isRTL ? 'تخطي ✕' : 'Skip ✕'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {step === steps.length - 1 
                ? (isRTL ? '✓ فهمت!' : '✓ Got it!')
                : (isRTL ? 'التالي ←' : 'Next →')
              }
            </Text>
          </TouchableOpacity>
        </View>

        {/* Floating Pointer Icon */}
        <View style={[
          styles.pointerIcon,
          current.cardPosition === 'top' 
            ? { bottom: -24, top: undefined }
            : { top: -24, bottom: undefined }
        ]}>
          <Text style={styles.pointerEmoji}>
            {current.cardPosition === 'top' ? '👇' : '👆'}
          </Text>
        </View>
      </Animated.View>

      {/* ❌ TRIANGLE SUPPRIMÉ - On garde juste le spotlight avec son triangle natif */}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 40, 24, 0.88)',
  },
  spotlightGlow: {
    position: 'absolute',
    borderRadius: 18,
    backgroundColor: '#C9A961',
    shadowColor: '#C9A961',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 15,
  },
  spotlight: {
    position: 'absolute',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#C9A961',
    backgroundColor: 'transparent',
    shadowColor: '#C9A961',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
  },
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 24,
    borderWidth: 3,
    borderColor: '#C9A961',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 7,
    backgroundColor: 'rgba(201, 169, 97, 0.25)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#C9A961',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
    marginBottom: 18,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(201, 169, 97, 0.35)',
  },
  dotActive: {
    backgroundColor: '#C9A961',
    width: 26,
  },
  dotCompleted: {
    backgroundColor: '#1a4d2e',
  },
  textContainer: {
    marginBottom: 20,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  stepIcon: {
    fontSize: 24,
  },
  stepLabel: {
    fontSize: 13,
    color: '#C9A961',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  guideText: {
    fontSize: 16,
    color: '#1a4d2e',
    lineHeight: 24,
    fontWeight: '500',
  },
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(136, 136, 136, 0.15)',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#1a4d2e',
    paddingVertical: 15,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#1a4d2e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  nextButtonText: {
    color: '#C9A961',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.6,
  },
  pointerIcon: {
    position: 'absolute',
    right: 22,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#C9A961',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  pointerEmoji: {
    fontSize: 24,
  },
});