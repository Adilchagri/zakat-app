import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, Platform, KeyboardAvoidingView, ScrollView 
} from 'react-native';
import * as Haptics from 'expo-haptics';

export default function WealthDetailModal({ 
  visible, onClose, wealthEntries, onAdd, onDelete, lang, currency 
}) {
  const [amount, setAmount] = useState('');
  
  const isRTL = lang === 'ar';
  
  const handleAdd = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(lang === 'ar' ? 'خطأ' : 'Error', lang === 'ar' ? 'مبلغ غير صحيح' : 'Invalid amount');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd(val);
    setAmount('');
  };

  const handleDelete = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === 'web') {
      if (window.confirm(lang === 'ar' ? 'هل تريد حذف هذا المبلغ؟' : 'Delete this entry?')) {
        onDelete(id);
      }
    } else {
      Alert.alert(
        lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete',
        lang === 'ar' ? 'هل تريد حذف هذا المبلغ؟' : 'Delete this entry?',
        [
          { text: lang === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
          { 
            text: lang === 'ar' ? 'حذف' : 'Delete', 
            style: 'destructive',
            onPress: () => onDelete(id)
          }
        ]
      );
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalTitle}>
              {lang === 'ar' ? '💰 تفاصيل الأموال' : '💰 Wealth Details'}
            </Text>

            {/* Add New Entry Form */}
            <View style={styles.addForm}>
              <Text style={[styles.label, isRTL && styles.textRight]}>
                {lang === 'ar' ? 'إضافة مبلغ جديد' : 'Add New Amount'}
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { flex: 1, textAlign: isRTL ? 'right' : 'left' }]}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                <Text style={styles.addBtnText}>{lang === 'ar' ? 'إضافة' : 'Add'}</Text>
              </TouchableOpacity>
            </View>

            {/* List of Entries */}
            <Text style={[styles.label, { marginTop: 24, marginBottom: 12 }, isRTL && styles.textRight]}>
              {lang === 'ar' ? 'سجل الإضافات هذا الشهر' : 'Entries this month'}
            </Text>
            
            <View style={styles.list}>
              {wealthEntries && wealthEntries.length > 0 ? (
                wealthEntries.map((item) => (
                  <View key={item.id} style={[styles.listItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemAmount, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {item.amount.toFixed(2)} {currency}
                      </Text>
                      <Text style={[styles.itemDate, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {new Date(item.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                      <Text style={styles.deleteIcon}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>
                  {lang === 'ar' ? 'لا توجد إضافات' : 'No entries yet'}
                </Text>
              )}
            </View>

            <TouchableOpacity 
              style={styles.closeBtn} 
              onPress={() => {
                Haptics.selectionAsync();
                onClose();
              }}
            >
              <Text style={styles.closeBtnText}>{lang === 'ar' ? 'إغلاق' : 'Close'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)', // Slightly lighter overlay
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 28, // Smoother corners
    maxHeight: '85%',
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    overflow: 'hidden',
    // Shadow for elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  scrollContent: {
    padding: 24, // Increased padding
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a4d2e',
    textAlign: 'center',
    marginBottom: 24,
  },
  addForm: {
    backgroundColor: '#f8f9fa', // Lighter grey
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textRight: {
    textAlign: 'right',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  addBtn: {
    backgroundColor: '#1a4d2e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#1a4d2e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  list: {
    marginTop: 0,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemAmount: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  itemDesc: {
    fontSize: 14,
    color: '#666',
  },
  itemDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  deleteBtn: {
    padding: 10,
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
  },
  deleteIcon: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    padding: 30,
    color: '#999',
    fontStyle: 'italic',
  },
  closeBtn: {
    marginTop: 30,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
});