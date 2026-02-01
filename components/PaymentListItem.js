import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function PaymentListItem({ payment, onEdit, onDelete, lang, currency }) {
  const amount = payment.amount;
  const displayCurrency = currency || (lang === 'ar' ? 'د.م.' : 'MAD');
  const isRTL = lang === 'ar';

  return (
    <View style={[styles.paymentRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={styles.amountContainer}>
        <Text style={[styles.amountText, { textAlign: isRTL ? 'right' : 'left' }]}>
          {amount} {displayCurrency}
        </Text>
      </View>

      <View style={[
        styles.actionsContainer, 
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
        !isRTL && { marginTop: 2 }
      ]}>
        <TouchableOpacity onPress={() => onEdit(payment)}>
          <Text style={{ fontSize: 20 }}>✏️</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onDelete(payment)}>
          <Text style={{ fontSize: 20 }}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  amountContainer: {
    flex: 1,
    minWidth: 0,
  },

  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E4D2B',
  },

  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 10,
    marginStart: 12,
    flexShrink: 0,
  },
});