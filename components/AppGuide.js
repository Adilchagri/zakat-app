import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const steps = [
  {
    key: 'quote',
    text: 'آيات قرآنية وأحاديث نبوية عن الزكاة - تتغير تلقائياً كل 5 ثواني',
    textEn: 'Quranic verses and Hadiths about Zakat - change automatically every 5 seconds',
    target: { top: 140, height: 120 }, // Approximate position
  },
  {
    key: 'nisab',
    text: 'اختر نوع النصاب: الفضة موصى به (أقل قيمة = زكاة أكثر للفقراء)',
    textEn: 'Choose Nisab type: Silver recommended (lower value = more Zakat for poor)',
    target: { top: 270, height: 100 },
  },
  {
    key: 'gold',
    text: 'سعر الذهب اليوم بالدولار - يتحول تلقائياً إلى الدرهم للجرام',
    textEn: 'Today\'s gold price in USD - automatically converts to MAD per gram',
    target: { top: 380, height: 90, width: width / 2 },
  },
  {
    key: 'silver',
    text: 'سعر الفضة - يُستخدم لحساب النصاب إذا اخترت الفضة',
    textEn: 'Silver price - used to calculate Nisab if you choose Silver',
    target: { top: 480, height: 90, width: width / 2 },
  },
  {
    key: 'wealth',
    text: 'أدخل مالك الكلي بالدرهم المغربي (نقود + ذهب + فضة + استثمارات)',
    textEn: 'Enter your total wealth in MAD (cash + gold + silver + investments)',
    target: { top: 380, height: 190, width: width / 2, right: 0 },
  },
  {
    key: 'calculate',
    text: 'النتيجة ستظهر هنا: النصاب، الزكاة الواجبة، أو المبلغ المتبقي',
    textEn: 'Results will appear here: Nisab, Zakat due, or remaining amount',
    target: { top: 600, height: 200 },
  },
];

export default function AppGuide({ onFinish, lang = 'ar' }) {
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  
  const current = steps[step];
  const isRTL = lang === 'ar';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  const handleNext = () => {
    Haptics.selectionAsync();
    if (step === steps.length - 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => onFinish());
    } else {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 20, duration: 200, useNativeDriver: true }),
        ]),
      ]).start(() => {
        setStep(step + 1);
        // Animations will restart via useEffect
      });
    }
  };

  const handleSkip = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onFinish());
  };

  return (
    <View style={styles.overlay} pointerEvents="auto">
      {/* Semi-transparent background */}
      <View style={styles.backdrop} />

      {/* Content Card - Always centered to avoid overlapping issues */}
      <Animated.View 
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.stepIndicator}>
            {step + 1} / {steps.length}
          </Text>
          <Text style={styles.title}>
            {isRTL ? 'دليل الاستخدام' : 'App Guide'}
          </Text>
        </View>

        <Text style={[styles.description, isRTL && styles.textRTL]}>
          {isRTL ? current.text : current.textEn}
        </Text>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>{isRTL ? 'تخطي' : 'Skip'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextText}>
              {step === steps.length - 1 
                ? (isRTL ? 'إنهاء' : 'Finish') 
                : (isRTL ? 'التالي' : 'Next')
              }
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    justifyContent: 'center', // Align card to center
    paddingBottom: 0,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIndicator: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C9A961',
    backgroundColor: 'rgba(201, 169, 97, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a4d2e',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  description: {
    fontSize: 18,
    color: '#333',
    lineHeight: 28,
    marginBottom: 30,
    fontWeight: '500',
  },
  textRTL: {
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: '#1a4d2e',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    shadowColor: '#1a4d2e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});