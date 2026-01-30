import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function PaymentListItem({ payment, onEdit, onDelete, lang, currency = 'MAD' }) {
  const date = new Date(payment.timestamp);
  const monthNames = lang === 'ar' 
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <View style={styles.paymentItem}>
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentMonth}>
          {date.getDate()} {monthNames[date.getMonth()]} {date.getFullYear()}
        </Text>
        <Text style={styles.paymentAmount}>
          {payment.amount.toFixed(2)} {currency}
        </Text>
      </View>
      <View style={styles.paymentActions}>
        <TouchableOpacity onPress={() => onEdit(payment)} style={styles.editBtn}>
          <Text style={styles.actionIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(payment)} style={styles.deleteBtn}>
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  paymentInfo: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  paymentMonth: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  paymentAmount: {
    fontWeight: 'bold',
    color: '#1a4d2e',
    fontSize: 16,
  },
  paymentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editBtn: {
    padding: 6,
  },
  deleteBtn: {
    padding: 6,
  },
  actionIcon: {
    fontSize: 16,
  },
});
