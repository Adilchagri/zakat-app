import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert 
} from 'react-native';

export default function PaymentModal({ visible, onClose, onSave, lang, editingPayment, currency = 'MAD' }) {
  const content = {
    en: {
      editPayment: "Edit Payment",
      addPayment: "Add Payment",
      paymentAmount: "Payment Amount",
      paymentDate: "Date",
      cancel: "Cancel",
      savePayment: "Save Payment",
      error: "Error",
      invalidAmount: "Please enter a valid amount"
    },
    ar: {
      editPayment: "تعديل الدفعة",
      addPayment: "إضافة دفعة",
      paymentAmount: "المبلغ",
      paymentDate: "التاريخ",
      cancel: "إلغاء",
      savePayment: "حفظ",
      error: "خطأ",
      invalidAmount: "الرجاء إدخال مبلغ صحيح"
    }
  };

  const t = content[lang] || content.en;
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
      Alert.alert(t.error, t.invalidAmount);
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
              {t.paymentAmount} ({currency})
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
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  paymentModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  paymentModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a4d2e',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  paymentInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateDisplay: {
    fontSize: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#eee',
  },
  saveButton: {
    backgroundColor: '#1a4d2e',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  textRight: {
    textAlign: 'right',
  },
});
