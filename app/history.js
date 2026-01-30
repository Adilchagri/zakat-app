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
    if (viewMode === 'tracking') {
      setViewMode('calendar');
    } else {
      router.back();
    }
  };

  const handleMonthSelect = (monthIndex) => {
    // Set the current date in the hook to the 1st of the selected month
    const newDate = new Date(currentYear, monthIndex, 1);
    setCurrentDate(newDate);
    setViewMode('tracking');
  };

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
      default: return 'rgba(255,255,255,0.1)';
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
              <Text style={styles.statValue}>{totalDue.toFixed(2)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{lang === 'ar' ? 'المدفوع' : 'Paid'}</Text>
              <Text style={[styles.statValue, { color: '#1a4d2e' }]}>{totalPaid.toFixed(2)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{lang === 'ar' ? 'المتبقي' : 'Remaining'}</Text>
              <Text style={[styles.statValue, { color: '#C9A961' }]}>{remaining.toFixed(2)}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.addPaymentBtn}
            onPress={() => {
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
          onPress={() => setLang(lang === 'ar' ? 'en' : 'ar')} 
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
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, 
    backgroundColor: 'rgba(201, 169, 97, 0.1)', 
    borderBottomWidth: 2, borderBottomColor: '#C9A961' 
  },
  backBtn: { 
    width: 40, height: 40, borderRadius: 20, 
    backgroundColor: 'rgba(201, 169, 97, 0.2)', 
    justifyContent: 'center', alignItems: 'center' 
  },
  backIcon: { fontSize: 24, color: '#C9A961' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#C9A961' },
  langBtn: { padding: 8 },
  langText: { color: '#C9A961', fontWeight: 'bold' },
  content: { flex: 1, padding: 16 },

  // Calendar Styles
  calendarContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#C9A961'
  },
  sectionTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#C9A961', marginBottom: 16, textAlign: 'center'
  },
  calendarGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center'
  },
  calendarMonth: {
    width: '30%', aspectRatio: 1, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(201, 169, 97, 0.3)',
    marginBottom: 8
  },
  currentMonthBorder: {
    borderWidth: 2, borderColor: '#FFF',
  },
  calendarMonthName: {
    fontSize: 14, fontWeight: 'bold'
  },
  statusIcon: {
    fontSize: 12, color: '#FFF', marginTop: 4
  },
  legendContainer: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16, justifyContent: 'center'
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendBox: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: 12, color: '#E8D7B5' },

  // Tracking Styles
  trackingContainer: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    borderLeftWidth: 5, borderLeftColor: '#1a4d2e',
    marginBottom: 20
  },
  trackingHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 
  },
  backToCalBtn: {
    padding: 8, backgroundColor: '#f0f0f0', borderRadius: 8
  },
  backToCalText: { fontSize: 20 },
  trackingTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a4d2e', textAlign: 'center' },
  trackingSubtitle: { fontSize: 14, color: '#666', marginTop: 4, textAlign: 'center' },
  
  statsRow: { 
    flexDirection: 'row', justifyContent: 'space-between', 
    backgroundColor: '#f9f9f9', padding: 12, borderRadius: 12, marginBottom: 20 
  },
  statItem: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  statDivider: { width: 1, backgroundColor: '#ddd' },

  addPaymentBtn: {
    backgroundColor: '#1a4d2e', paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4
  },
  addPaymentText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  listTitle: { fontSize: 14, fontWeight: 'bold', color: '#1a4d2e', marginBottom: 10 },
  emptyListText: { textAlign: 'center', color: '#999', fontStyle: 'italic', padding: 10 },

  resetLink: { marginTop: 20, alignItems: 'center' },
  resetLinkText: { color: '#FF5252', fontSize: 12 },

  // Empty State
  emptyTracking: { alignItems: 'center', padding: 20 },
  emptyIcon: { fontSize: 50, marginBottom: 10 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  emptySub: { textAlign: 'center', color: '#666', marginTop: 8 },
});