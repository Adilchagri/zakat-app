import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

export default function DevelopedByModal({ visible, onClose, lang = 'ar' }) {
  const isRTL = lang === 'ar';

  const names = [
    "Adil Chagri",
    "Chouaib Jbel",
    "Amine Bazaoui"
  ];

  const content = {
    en: {
      title: "Developed By",
      close: "Close",
      version: "Version 2.0.0"
    },
    ar: {
      title: "تطوير",
      close: "إغلاق",
      version: "الإصدار 2.0.0"
    }
  };

  const t = isRTL ? content.ar : content.en;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{t.title}</Text>
          
          <View style={styles.listContainer}>
            {names.map((name, index) => (
              <View key={index} style={styles.nameRow}>
                <View style={styles.bullet} />
                <Text style={styles.nameText}>{name}</Text>
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t.version}</Text>
            <Text style={styles.footerText}>© 2026</Text>
          </View>

          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => {
              Haptics.selectionAsync();
              onClose();
            }}
          >
            <Text style={styles.closeButtonText}>{t.close}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 30,
    width: '100%',
    maxWidth: 340,
    borderWidth: 2,
    borderColor: '#C9A961',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a4d2e',
    marginBottom: 24,
    textAlign: 'center',
  },
  listContainer: {
    width: '100%',
    marginBottom: 24,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C9A961',
    marginRight: 12,
  },
  nameText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  closeButton: {
    backgroundColor: '#1a4d2e',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});