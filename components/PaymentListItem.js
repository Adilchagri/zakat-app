import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { moderateScale } from '../utils/scale';


export default function PaymentListItem({ payment, onEdit, onDelete, lang, currency }) {
  const displayCurrency = currency || (lang === 'ar' ? 'د.م.' : 'MAD');

  return (
    <View style={styles.paymentItem}>
      <View style={styles.paymentInfo}>
        <Text 
          style={styles.paymentAmount} 
          numberOfLines={1} 
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          allowFontScaling={false}
        >
          {payment.amount.toFixed(0)} {displayCurrency}
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
    alignItems: 'center',
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    minHeight: moderateScale(52),
    paddingHorizontal: moderateScale(4),
  },

  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: moderateScale(8),
  },

  paymentAmount: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: '#111',
    flex: 1,
  },

  paymentActions: {
    flexDirection: 'row',
    gap: moderateScale(10),
    width: moderateScale(72),
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  editBtn: {
    padding: moderateScale(5),
  },
  deleteBtn: {
    padding: moderateScale(5),
  },
  actionIcon: {
    fontSize: moderateScale(16),
  },

});
