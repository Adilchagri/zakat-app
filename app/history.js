import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Dimensions, Animated, Alert, Platform, BackHandler 
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useZakatData } from '../hooks/useZakatData';
import PaymentModal from '../components/PaymentModal';
import ProgressBar from '../components/ProgressBar';
import PaymentListItem from '../components/PaymentListItem';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Month names
const monthNames = {
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
};

export default function History() {
  const { 
    data, refresh, currentMonthData, 
    addPayment, updatePayment, deletePayment, resetMonth,
    setCurrentDate // We need this to switch months
  } = useZakatData();
  
  const [lang, setLang] = useState('ar');
  const [viewMode, setViewMode] = useState('calendar'); // Default to calendar
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const currentYear = new Date().getFullYear();

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
    refresh();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Handle Android hardware back button
    const backAction = () => {
      if (viewMode === 'tracking') {
        setViewMode('calendar');
        return true; // prevent default
      }
      return false; // use default (go back)
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [viewMode, refresh]);

  // --- Handlers ---
  const handleBack = () => {
    Haptics.selectionAsync();
    if (viewMode === 'tracking') {
      setViewMode('calendar');
    } else {
      router.back();
    }
  };

  const handleMonthSelect = (monthIndex) => {
    Haptics.selectionAsync();
    // Set the current date in the hook to the 1st of the selected month
    const newDate = new Date(currentYear, monthIndex, 1);
    setCurrentDate(newDate);
    setViewMode('tracking');
  };

  const handleSavePayment = async (payment) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (editingPayment) {
      await updatePayment(payment);
    } else {
      await addPayment(payment.amount, payment.date);
    }
    setShowPaymentModal(false);
    setEditingPayment(null);
  };

  const handleDeletePayment = (payment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === 'web') {
      if (window.confirm(lang === 'ar' ? 'هل تريد حذف هذه الدفعة؟' : 'Delete this payment?')) {
        deletePayment(payment.id);
      }
    } else {
      Alert.alert(
        lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete',
        lang === 'ar' ? 'هل تريد حذف هذه الدفعة؟' : 'Delete this payment?', 
        [
          { text: lang === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
          {
            text: lang === 'ar' ? 'حذف' : 'Delete',
            style: 'destructive',
            onPress: () => deletePayment(payment.id)
          }
        ]
      );
    }
  };

  const handleResetMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (Platform.OS === 'web') {
      if (window.confirm(lang === 'ar' ? 'سيتم حذف جميع بيانات هذا الشهر. هل تريد المتابعة؟' : 'This will clear all month data. Continue?')) {
        resetMonth();
      }
    } else {
      Alert.alert(
        lang === 'ar' ? 'إعادة ضبط الشهر' : 'Reset Month',
        lang === 'ar' ? 'سيتم حذف جميع بيانات هذا الشهر.' : 'This will clear all month data.',
        [
          { text: lang === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
          {
            text: lang === 'ar' ? 'تأكيد' : 'Confirm',
            style: 'destructive',
            onPress: () => resetMonth()
          }
        ]
      );
    }
  };

  // --- Calculations for Current Month (from Hook) ---
  const totalDue = currentMonthData?.totalZakatDue || 0;
  const totalPaid = currentMonthData?.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const remaining = Math.max(0, totalDue - totalPaid);
  const progress = totalDue > 0 ? Math.min(100, (totalPaid / totalDue) * 100) : 0;

  // --- Helper to get month status for calendar ---
  const getMonthStatus = (monthIndex) => {
    const key = `${currentYear}-${monthIndex}`;
    const mData = data[key];
    if (!mData) return 'empty';
    
    const mPaid = mData.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const mDue = mData.totalZakatDue || 0;

    if (mDue > 0 && mPaid >= mDue) return 'complete';
    if (mPaid > 0) return 'partial';
    if (mData.totalWealth > 0) return 'started'; // Has wealth but no payment/zakat
    return 'empty';
  };

  const getMonthColor = (status) => {
    switch (status) {
      case 'complete': return '#1a4d2e';
      case 'partial': return '#C9A961';
      case 'started': return '#FFECB3'; // Light gold
      default: return 'rgba(255,255,255,0.05)';
    }
  };

  const getMonthTextColor = (status) => {
    if (status === 'complete') return '#FFF';
    if (status === 'partial') return '#000';
    if (status === 'started') return '#000';
    return '#C9A961'; // Default text color
  };

  // --- Components ---

  const CalendarView = () => (
    <View style={styles.calendarContainer}>
      <Text style={styles.sectionTitle}>
        {lang === 'ar' ? `🗓️ تقويم ${currentYear}` : `🗓️ ${currentYear} Calendar`}
      </Text>
      <View style={styles.calendarGrid}>
        {Array.from({ length: 12 }, (_, i) => {
          const status = getMonthStatus(i);
          const bgColor = getMonthColor(status);
          const textColor = getMonthTextColor(status);
          const isCurrentMonth = new Date().getMonth() === i;
          
          return (
            <TouchableOpacity 
              key={i} 
              style={[
                styles.calendarMonth,
                { backgroundColor: bgColor },
                isCurrentMonth && styles.currentMonthBorder
              ]}
              onPress={() => handleMonthSelect(i)}
            >
              <Text style={[styles.calendarMonthName, { color: textColor }]}>
                {monthNames[lang][i]}
              </Text>
              {status === 'complete' && <Text style={styles.statusIcon}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#1a4d2e'}]} />
          <Text style={styles.legendText}>{lang === 'ar' ? 'مكتمل' : 'Complete'}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#C9A961'}]} />
          <Text style={styles.legendText}>{lang === 'ar' ? 'جارٍ' : 'Partial'}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: '#C9A961', borderWidth: 1}]} />
          <Text style={styles.legendText}>{lang === 'ar' ? 'فارغ' : 'Empty'}</Text>
        </View>
      </View>
    </View>
  );

  const TrackingView = () => (
    <View style={styles.trackingContainer}>
      <View style={styles.trackingHeader}>
        <TouchableOpacity onPress={() => setViewMode('calendar')} style={styles.backToCalBtn}>
          <Text style={styles.backToCalText}>📅</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.trackingTitle}>
            {lang === 'ar' ? 'تفاصيل الشهر' : 'Month Details'}
          </Text>
          <Text style={styles.trackingSubtitle}>
            {monthNames[lang][currentMonthData.month]} {currentMonthData.year}
          </Text>
        </View>
        <View style={{width: 40}} /> 
      </View>

      {totalDue > 0 ? (
        <View style={styles.activeTracking}>
          <ProgressBar progress={progress} />
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{lang === 'ar' ? 'المطلوب' : 'Due'}</Text>
              <Text style={styles.statValue} adjustsFontSizeToFit numberOfLines={1}>
                {totalDue.toFixed(2)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{lang === 'ar' ? 'المدفوع' : 'Paid'}</Text>
              <Text style={[styles.statValue, { color: '#1a4d2e' }]} adjustsFontSizeToFit numberOfLines={1}>
                {totalPaid.toFixed(2)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{lang === 'ar' ? 'المتبقي' : 'Remaining'}</Text>
              <Text style={[styles.statValue, { color: '#C9A961' }]} adjustsFontSizeToFit numberOfLines={1}>
                {remaining.toFixed(2)}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.addPaymentBtn}
            onPress={() => {
              Haptics.selectionAsync();
              setEditingPayment(null);
              setShowPaymentModal(true);
            }}
          >
            <Text style={styles.addPaymentText}>
              {lang === 'ar' ? '➕ إضافة دفعة' : '➕ Add Payment'}
            </Text>
          </TouchableOpacity>

          <View style={styles.paymentsList}>
            <Text style={styles.listTitle}>
              {lang === 'ar' ? 'سجل المدفوعات' : 'Payment History'}
            </Text>
            {currentMonthData.payments && currentMonthData.payments.length > 0 ? (
              currentMonthData.payments.map((p) => (
                <PaymentListItem
                  key={p.id}
                  payment={p}
                  onEdit={(item) => {
                    setEditingPayment(item);
                    setShowPaymentModal(true);
                  }}
                  onDelete={handleDeletePayment}
                  lang={lang}
                />
              ))
            ) : (
              <Text style={styles.emptyListText}>
                {lang === 'ar' ? 'لا توجد مدفوعات بعد' : 'No payments yet'}
              </Text>
            )}
          </View>

          <TouchableOpacity onPress={handleResetMonth} style={styles.resetLink}>
            <Text style={styles.resetLinkText}>
              {lang === 'ar' ? 'إعادة ضبط الشهر' : 'Reset Month'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyTracking}>
          <Text style={styles.emptyIcon}>💰</Text>
          <Text style={styles.emptyTitle}>
            {lang === 'ar' ? 'لا توجد زكاة مستحقة' : 'No Zakat Due'}
          </Text>
          <Text style={styles.emptySub}>
            {lang === 'ar' 
              ? 'الرجاء العودة للصفحة الرئيسية وإضافة الأموال لهذا الشهر لحساب الزكاة' 
              : 'Please return to home page and add funds for this month to calculate Zakat'}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {lang === 'ar' ? 'التتبع والإحصائيات' : 'Tracking & Stats'}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => {
            Haptics.selectionAsync();
            setLang(lang === 'ar' ? 'en' : 'ar');
          }} 
          style={styles.langBtn}
        >
          <Text style={styles.langText}>{lang === 'en' ? 'ع' : 'EN'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {viewMode === 'calendar' ? <CalendarView /> : <TrackingView />}
        </Animated.View>
      </ScrollView>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a2818' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, 
    // Removed border for cleaner look
  },
  backBtn: { 
    width: 44, height: 44, borderRadius: 22, 
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    justifyContent: 'center', alignItems: 'center' 
  },
  backIcon: { fontSize: 24, color: '#C9A961' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#C9A961' },
  langBtn: { padding: 8 },
  langText: { color: '#C9A961', fontWeight: 'bold', fontSize: 16 },
  content: { flex: 1, padding: 20 },

  // Calendar Styles
  calendarContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: 'rgba(201, 169, 97, 0.2)'
  },
  sectionTitle: {
    fontSize: 20, fontWeight: 'bold', color: '#C9A961', marginBottom: 20, textAlign: 'center'
  },
  calendarGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center'
  },
  calendarMonth: {
    width: '30%', aspectRatio: 1, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 8
  },
  currentMonthBorder: {
    borderWidth: 2, borderColor: '#C9A961',
  },
  calendarMonthName: {
    fontSize: 14, fontWeight: 'bold'
  },
  statusIcon: {
    fontSize: 14, color: '#FFF', marginTop: 4
  },
  legendContainer: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 24, justifyContent: 'center'
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendBox: { width: 14, height: 14, borderRadius: 4 },
  legendText: { fontSize: 13, color: '#E8D7B5' },

  // Tracking Styles
  trackingContainer: {
    backgroundColor: '#fff', borderRadius: 24, padding: 24,
    borderLeftWidth: 6, borderLeftColor: '#1a4d2e',
    marginBottom: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 6
  },
  trackingHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 
  },
  backToCalBtn: {
    padding: 10, backgroundColor: '#f5f5f5', borderRadius: 12
  },
  backToCalText: { fontSize: 22 },
  trackingTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a4d2e', textAlign: 'center' },
  trackingSubtitle: { fontSize: 15, color: '#666', marginTop: 4, textAlign: 'center' },
  
  statsRow: { 
    flexDirection: 'row', justifyContent: 'space-between', 
    backgroundColor: '#f8f9fa', padding: 16, borderRadius: 16, marginBottom: 24 
  },
  statItem: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 12, color: '#888', marginBottom: 6, textTransform: 'uppercase' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statDivider: { width: 1, backgroundColor: '#e0e0e0', height: '80%', alignSelf: 'center' },

  addPaymentBtn: {
    backgroundColor: '#1a4d2e', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', marginBottom: 24,
    shadowColor: '#1a4d2e', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
  },
  addPaymentText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  listTitle: { 
    fontSize: 13, fontWeight: '700', color: '#999', marginBottom: 12, 
    textTransform: 'uppercase', letterSpacing: 0.5 
  },
  emptyListText: { textAlign: 'center', color: '#999', fontStyle: 'italic', padding: 20 },

  resetLink: { marginTop: 30, alignItems: 'center', padding: 10 },
  resetLinkText: { color: '#FF5252', fontSize: 14, fontWeight: '600' },

  // Empty State
  emptyTracking: { alignItems: 'center', padding: 30 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  emptySub: { textAlign: 'center', color: '#666', marginTop: 10, lineHeight: 22 },
});
