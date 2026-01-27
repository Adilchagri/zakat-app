import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Dimensions, Animated, Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const { width , height} = Dimensions.get('window');

// Month names in Arabic and English
const monthNames = {
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
};

// Simple Bar Chart Component
const BarChart = ({ data, maxValue, lang }) => {
  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>
        <Text style={styles.scrollHint}>
        ⇆ {lang === 'ar' ? 'اسحب لليسار أو اليمين لرؤية الكل' : 'Swipe left or right to see all'}
        </Text>

        {lang === 'ar' ? '📊 المدفوعات الشهرية' : '📊 Monthly Payments'}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.barsContainer}
        >

        {data.map((item, index) => {
          const heightPercent = maxValue > 0 ? (item.amount / maxValue) * 100 : 0;
          return (
            <View key={index} style={styles.barWrapper}>
              <View style={styles.barColumn}>
                <View style={[styles.bar, { height: `${heightPercent}%` }]}>
                  {item.amount > 0 && (
                    <Text style={styles.barValue}>{item.amount.toFixed(0)}</Text>
                  )}
                </View>
              </View>
              <Text style={styles.barLabel}>{item.label}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

// Calendar View Component
const CalendarView = ({ payments, lang, currentYear }) => {
  const getMonthPayments = (monthIndex) => {
    return payments.filter(p => {
      const date = new Date(p.timestamp);
      return date.getMonth() === monthIndex && date.getFullYear() === currentYear;
    });
  };

  const getMonthTotal = (monthIndex) => {
    const monthPayments = getMonthPayments(monthIndex);
    return monthPayments.reduce((sum, p) => sum + p.amount, 0);
  };

 const getMonthColor = (total) => {
  if (total === 0) return '#4A4A4A';      // Changed!
  if (total < 500) return '#FFF9C4';     // Changed!
  if (total < 1000) return '#FFEB3B';    // Changed!
  if (total < 2000) return '#FFC107';    // Changed!
  return '#C9A961';                      // Changed!
};

  const getTextColor = (total) => {
    if (total === 0) return '#999';
    if (total < 2000) return '#1a4d2e';
    return '#0a2818';
  };

  return (
    <View style={styles.calendarContainer}>
      <Text style={styles.calendarTitle}>
        {lang === 'ar' ? `🗓️ تقويم ${currentYear}` : `🗓️ ${currentYear} Calendar`}
      </Text>
      <View style={styles.calendarGrid}>
        {Array.from({ length: 12 }, (_, i) => {
          const total = getMonthTotal(i);
          const payments = getMonthPayments(i);
          const bgColor = getMonthColor(total);
          const textColor = getTextColor(total);
          
          return (
            <TouchableOpacity 
              key={i} 
              style={[
                styles.calendarMonth,
                { backgroundColor: bgColor }
              ]}
              onPress={() => {
                if (payments.length > 0) {
                  const details = payments.map(p => 
                    `${new Date(p.timestamp).getDate()}/${i + 1}: ${p.amount.toFixed(2)}`
                  ).join('\n');
                  Alert.alert(
                    monthNames[lang][i],
                    `${lang === 'ar' ? 'المدفوعات' : 'Payments'}:\n${details}\n\n${lang === 'ar' ? 'المجموع' : 'Total'}: ${total.toFixed(2)}`
                  );
                }
              }}
            >
              <Text style={[styles.calendarMonthName, { color: textColor }]}>
                {monthNames[lang][i]}
              </Text>
              {total > 0 && (
                <Text style={[styles.calendarMonthAmount, { color: textColor }]}>
                  {total.toFixed(0)}
                </Text>
              )}
              {payments.length > 0 && (
                <View style={styles.paymentIndicator}>
                  <Text style={styles.paymentCount}>{payments.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#4A4A4A'}]} />
          <Text style={styles.legendText}>{lang === 'ar' ? 'لا شيء' : 'None'}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#FFF9C4'}]} />
          <Text style={styles.legendText}>{'< 500'}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#FFEB3B'}]} />
          <Text style={styles.legendText}>{'< 1K'}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#FFC107'}]} />
          <Text style={styles.legendText}>{'< 2K'}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#C9A961'}]} />
          <Text style={styles.legendText}>{'2K+'}</Text>
        </View>
      </View>
    </View>
  );
};

// Statistics Cards Component
const StatsCards = ({ tracker, lang }) => {
  const totalPaid = tracker?.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const remaining = tracker ? Math.max(0, tracker.totalZakat - totalPaid) : 0;
  const progress = tracker && tracker.totalZakat > 0 
    ? (totalPaid / tracker.totalZakat) * 100 
    : 0;
  const avgPayment = tracker?.payments?.length > 0 
    ? totalPaid / tracker.payments.length 
    : 0;

  const stats = [
    {
      icon: '💰',
      label: lang === 'ar' ? 'إجمالي المطلوب' : 'Total Required',
      value: tracker?.totalZakat?.toFixed(2) || '0.00',
      color: '#1976D2'
    },
    {
      icon: '✅',
      label: lang === 'ar' ? 'المدفوع' : 'Total Paid',
      value: totalPaid.toFixed(2),
      color: '#1a4d2e'
    },
    {
      icon: '⏳',
      label: lang === 'ar' ? 'المتبقي' : 'Remaining',
      value: remaining.toFixed(2),
      color: '#C9A961'
    },
    {
      icon: '📈',
      label: lang === 'ar' ? 'متوسط الدفعة' : 'Avg Payment',
      value: avgPayment.toFixed(2),
      color: '#D4AF37'
    },
    {
      icon: '📊',
      label: lang === 'ar' ? 'نسبة الإنجاز' : 'Progress',
      value: `${progress.toFixed(1)}%`,
      color: '#2E7D32'
    },
    {
      icon: '🔢',
      label: lang === 'ar' ? 'عدد الدفعات' : 'Payments',
      value: tracker?.payments?.length || 0,
      color: '#F57C00'
    }
  ];

  return (
    <View style={styles.statsContainer}>
      <Text style={styles.statsTitle}>
        {lang === 'ar' ? '📈 الإحصائيات' : '📈 Statistics'}
      </Text>
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={[styles.statCard, { borderLeftColor: stat.color }]}>
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Payment Timeline Component
const PaymentTimeline = ({ payments, lang }) => {
  const sortedPayments = [...payments].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <View style={styles.timelineContainer}>
      <Text style={styles.timelineTitle}>
        {lang === 'ar' ? '📅 سجل المدفوعات' : '📅 Payment Timeline'}
      </Text>
      {sortedPayments.length === 0 ? (
        <View style={styles.emptyTimeline}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>
            {lang === 'ar' ? 'لا توجد مدفوعات مسجلة' : 'No payments recorded yet'}
          </Text>
        </View>
      ) : (
        sortedPayments.map((payment, index) => {
          const date = new Date(payment.timestamp);
          const isFirst = index === 0;
          const isLast = index === sortedPayments.length - 1;
          
          return (
            <View key={payment.id} style={styles.timelineItem}>
              <View style={styles.timelineLine}>
                {!isFirst && <View style={styles.lineTop} />}
                <View style={styles.timelineDot} />
                {!isLast && <View style={styles.lineBottom} />}
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineCard}>
                  <View style={styles.timelineHeader}>
                    <Text style={styles.timelineDate}>
                      {date.getDate()} {monthNames[lang][date.getMonth()]} {date.getFullYear()}
                    </Text>
                    <Text style={styles.timelineAmount}>
                      {payment.amount.toFixed(2)} {lang === 'ar' ? 'د.م.' : 'MAD'}
                    </Text>
                  </View>
                  <View style={styles.timelineFooter}>
                    <Text style={styles.timelineTime}>
                      ⏰ {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
};

export default function History() {
  const [tracker, setTracker] = useState(null);
  const [lang, setLang] = useState('ar');
  const [viewMode, setViewMode] = useState('stats');
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    loadData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem('zakat_tracker');
      if (saved) {
        setTracker(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Error loading tracker:', error);
    }
  };

  const getChartData = () => {
    if (!tracker?.payments) return [];
    
    const monthlyData = Array(12).fill(0).map((_, i) => ({
      month: i,
      amount: 0,
      label: monthNames[lang][i]
    }));

    tracker.payments.forEach(payment => {
      const month = new Date(payment.timestamp).getMonth();
      monthlyData[month].amount += payment.amount;
    });

    return monthlyData;
  };

  const chartData = getChartData();
  const maxValue = Math.max(...chartData.map(d => d.amount), 100);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {lang === 'ar' ? '📜 سجل الزكاة' : '📜 Zakat History'}
          </Text>
          <Text style={styles.subtitle}>
            {tracker?.year || new Date().getFullYear()}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => setLang(lang === 'ar' ? 'en' : 'ar')} 
          style={styles.langBtn}
        >
          <Text style={styles.langText}>{lang === 'en' ? 'ع' : 'EN'}</Text>
        </TouchableOpacity>
      </View>

      {/* View Mode Selector */}
      <View style={styles.viewSelector}>
        <TouchableOpacity 
          style={[styles.viewBtn, viewMode === 'stats' && styles.viewBtnActive]}
          onPress={() => setViewMode('stats')}
        >
          <Text style={styles.viewBtnText}>📈</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.viewBtn, viewMode === 'chart' && styles.viewBtnActive]}
          onPress={() => setViewMode('chart')}
        >
          <Text style={styles.viewBtnText}>📊</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.viewBtn, viewMode === 'calendar' && styles.viewBtnActive]}
          onPress={() => setViewMode('calendar')}
        >
          <Text style={styles.viewBtnText}>🗓️</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.viewBtn, viewMode === 'timeline' && styles.viewBtnActive]}
          onPress={() => setViewMode('timeline')}
        >
          <Text style={styles.viewBtnText}>📅</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{}}>
          {!tracker ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>
                {lang === 'ar' ? 'لا توجد بيانات للزكاة بعد' : 'No Zakat data yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {lang === 'ar' 
                  ? 'قم بحساب زكاتك في الصفحة الرئيسية للبدء' 
                  : 'Calculate your Zakat on the main page to start'}
              </Text>
            </View>
          ) : (
            <>
              {viewMode === 'stats' && <StatsCards tracker={tracker} lang={lang} />}
              {viewMode === 'chart' && <BarChart data={chartData} maxValue={maxValue} lang={lang} />}
              {viewMode === 'calendar' && (
                <CalendarView 
                  payments={tracker.payments || []} 
                  lang={lang}
                  currentYear={tracker.year || new Date().getFullYear()}
                />
              )}
              {viewMode === 'timeline' && <PaymentTimeline payments={tracker.payments || []} lang={lang} />}
            </>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a2818',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'rgba(201, 169, 97, 0.1)',
    borderBottomWidth: 2,
    borderBottomColor: '#C9A961',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(201, 169, 97, 0.2)',
    borderWidth: 2,
    borderColor: '#C9A961',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#C9A961',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#C9A961',
  },
  subtitle: {
    fontSize: 14,
    color: '#E8D7B5',
    marginTop: 4,
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
  viewSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  viewBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: 'rgba(201, 169, 97, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  viewBtnActive: {
    backgroundColor: '#C9A961',
    borderColor: '#D4AF37',
  },
  viewBtnText: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#E8D7B5',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C9A961',
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // Stats Cards - MATCHING MAIN APP PALETTE
  statsContainer: {
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C9A961',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#C9A961',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 6,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  // Chart - MATCHING MAIN APP PALETTE
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 97, 0.3)',
    shadowColor: '#C9A961',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a4d2e',
    marginBottom: 20,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height : height * 0.28,
    paddingHorizontal: 4,
  },
  barWrapper: {
    width: 42,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  barColumn: {
    width: '100%',
    height: height * 0.24,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    backgroundColor: '#C9A961',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barValue: {
    fontSize: 8,
    color: '#0a2818',
    fontWeight: 'bold',
  },
  barLabel: {
    fontSize: 9,
    color: '#333',
    marginTop: 6,
    fontWeight: '600',
  },

  // Calendar - MATCHING MAIN APP PALETTE
  calendarContainer: {
    backgroundColor:'#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C9A961',
    shadowColor: '#C9A961',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  calendarTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1a4d2e',
    marginBottom: 16,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',  // Better spacing!
    gap: 8,
  },
  calendarMonth: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 12,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 97, 0.3)',
  },
  calendarMonthName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  calendarMonthAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  paymentIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF5252',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentCount: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#999',
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },

  // Timeline - MATCHING MAIN APP PALETTE
  timelineContainer: {
    marginBottom: 20,
  },
  timelineTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C9A961',
    marginBottom: 16,
  },
  emptyTimeline: {
    backgroundColor: '#FFFFFF', 
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 97, 0.3)',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLine: {
    width: 40,
    alignItems: 'center',
  },
  lineTop: {
    width: 2,
    flex: 1,
    backgroundColor: '#C9A961',
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#C9A961',
    borderWidth: 3,
    borderColor: '#D4AF37',
  },
  lineBottom: {
    width: 2,
    flex: 1,
    backgroundColor: '#C9A961',
  },
  timelineContent: {
    flex: 1,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#C9A961',
    borderWidth: 1,
    borderColor: '#C9A961',
    shadowColor: '#C9A961',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineDate: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  timelineAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a4d2e',
  },
  timelineFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineTime: {
    fontSize: 11,
    color: '#999',
  },


  scrollHint: {
  fontSize: 11,
  color: '#999',
  textAlign: 'center',
  marginBottom: 6,
  fontStyle: 'italic',
},

});