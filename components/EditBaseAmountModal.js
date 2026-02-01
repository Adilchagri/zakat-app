import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert 
} from 'react-native';

export default function EditBaseAmountModal({ 
  visible, onClose, onSave, onReset, lang, currentAmount, originalAmount 
}) {
  const content = {
    en: {
      title: "Edit Zakat Base Amount",
      description: "Adjust the total wealth amount used to calculate Zakat for this month.",
      label: "Zakat Base Amount",
      cancel: "Cancel",
      save: "Save Amount",
      reset: "Reset to Original",
      error: "Error",
      invalidAmount: "Please enter a valid amount",
      original: "Original: "
    },
    ar: {
      title: "تعديل المبلغ الخاضع للزكاة",
      description: "تعديل إجمالي المال المعتمد لحساب الزكاة لهذا الشهر.",
      label: "المبلغ الخاضع للزكاة",
      cancel: "إلغاء",
      save: "حفظ المبلغ",
      reset: "استعادة القيمة الأصلية",
      error: "خطأ",
      invalidAmount: "الرجاء إدخال مبلغ صحيح",
      original: "الأصلي: "
    }
  };

  const t = content[lang] || content.en;
  const isRTL = lang === 'ar';
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (visible) {
      setAmount(currentAmount !== undefined && currentAmount !== null ? currentAmount.toString() : '');
    }
  }, [visible, currentAmount]);

  const handleSave = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 0) {
      Alert.alert(t.error, t.invalidAmount);
      return;
    }
    onSave(amt);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isRTL && styles.rtlContainer]}>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.description}>{t.description}</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isRTL && styles.textRight]}>
              {t.label}
            </Text>
            <TextInput
              style={[styles.input, isRTL && styles.textRight]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
            {originalAmount !== undefined && (
              <Text style={[styles.originalText, isRTL && styles.textRight]}>
                {t.original} {originalAmount.toFixed(2)}
              </Text>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelBtn]} 
              onPress={onClose}
            >
              <Text style={styles.cancelText}>{t.cancel}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.saveBtn]} 
              onPress={handleSave}
            >
              <Text style={styles.saveText}>{t.save}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.resetBtn} 
            onPress={onReset}
          >
            <Text style={styles.resetText}>{t.reset}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a4d2e',
    textAlign: 'center',
    marginBottom: 8
  },
  description: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18
  },
  inputGroup: {
    marginBottom: 20
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  originalText: {
    fontSize: 11,
    color: '#888',
    marginTop: 6
  },
  textRight: {
    textAlign: 'right'
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelBtn: {
    backgroundColor: '#f0f0f0',
  },
  saveBtn: {
    backgroundColor: '#1a4d2e',
  },
  cancelText: {
    color: '#666',
    fontWeight: 'bold'
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  resetBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 4
  },
  resetText: {
    color: '#FF5252',
    fontSize: 13,
    fontWeight: '600'
  }
});
