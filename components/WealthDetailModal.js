import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, FlatList, Alert, Platform 
} from 'react-native';

export default function WealthDetailModal({ 
  visible, onClose, wealthEntries, onAdd, onDelete, lang, currency 
}) {
  const [amount, setAmount] = useState('');
  
  const isRTL = lang === 'ar';
  
  const handleAdd = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      Alert.alert(lang === 'ar' ? 'خطأ' : 'Error', lang === 'ar' ? 'مبلغ غير صحيح' : 'Invalid amount');
      return;
    }
    onAdd(val);
    setAmount('');
  };

  const handleDelete = (id) => {
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
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
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
                style={[styles.input, { flex: 1 }]}
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
          <Text style={[styles.label, { marginTop: 16 }, isRTL && styles.textRight]}>
            {lang === 'ar' ? 'سجل الإضافات هذا الشهر' : 'Entries this month'}
          </Text>
          
          <FlatList
            data={wealthEntries}
            keyExtractor={item => item.id}
            style={styles.list}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemAmount}>{item.amount.toFixed(2)} {currency}</Text>
                  <Text style={styles.itemDate}>
                    {new Date(item.timestamp).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {lang === 'ar' ? 'لا توجد إضافات' : 'No entries yet'}
              </Text>
            }
          />

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{lang === 'ar' ? 'إغلاق' : 'Close'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a4d2e',
    textAlign: 'center',
    marginBottom: 20,
  },
  addForm: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666',
  },
  textRight: {
    textAlign: 'right',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  addBtn: {
    backgroundColor: '#1a4d2e',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  list: {
    marginTop: 10,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemInfo: {
    flex: 1,
  },
  itemAmount: {
    fontSize: 16,
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
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 18,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#999',
  },
  closeBtn: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#eee',
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});
