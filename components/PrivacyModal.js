import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';

export default function PrivacyModal({ visible, onAccept, lang = 'ar' }) {
  const isRTL = lang === 'ar';

  const handleAccept = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAccept();
  };

  const content = {
    en: {
      title: "Zakat Tracker",
      subtitle: "Privacy & Safety Notice",
      body: "This app is completely safe.\nIt does not access any data on your phone.\nNo tracking, no permissions, no internet data collection.\nAll calculations are done locally on your device.",
      button: "I Understand"
    },
    ar: {
      title: "متتبع الزكاة",
      subtitle: "إشعار الخصوصية والأمان",
      body: "هذا التطبيق آمن تمامًا.\nلا يصل إلى أي بيانات على هاتفك.\nلا تتبع، لا أذونات، ولا جمع للبيانات.\nجميع الحسابات تتم محليًا على جهازك.",
      button: "فهمت"
    }
  };

  const t = isRTL ? content.ar : content.en;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onAccept}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.crescentIcon}>☪</Text>
            </View>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.subtitle}>{t.subtitle}</Text>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={[styles.bodyText, isRTL && styles.textRight]}>
              {t.body}
            </Text>
          </ScrollView>

          <TouchableOpacity 
            style={styles.acceptButton} 
            onPress={handleAccept}
            activeOpacity={0.8}
          >
            <Text style={styles.acceptButtonText}>{t.button}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', 
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 30,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#C9A961', 
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    marginBottom: 12,
  },
  crescentIcon: {
    fontSize: 48,
    color: '#C9A961',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a4d2e',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#C9A961',
    fontWeight: '600',
    textAlign: 'center',
  },
  body: {
    marginBottom: 30,
  },
  bodyText: {
    fontSize: 18,
    color: '#333',
    lineHeight: 28,
    textAlign: 'center',
    fontWeight: '500',
  },
  textRight: {
    textAlign: 'center', 
  },
  acceptButton: {
    backgroundColor: '#1a4d2e',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#1a4d2e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});