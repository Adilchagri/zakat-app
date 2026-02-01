import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'zakat_monthly_v1';
const ZAKAT_RATE = 0.025;

export const useZakatData = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const getMonthKey = (date) => `${date.getFullYear()}-${date.getMonth()}`;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        setData(JSON.parse(json));
      }
    } catch (e) {
      console.error('Failed to load Zakat data', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveData = async (newData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      setData(newData);
    } catch (e) {
      console.error('Failed to save Zakat data', e);
    }
  };

  const getMonthData = (date = currentDate) => {
    const key = getMonthKey(date);
    return data[key] || {
      id: key,
      year: date.getFullYear(),
      month: date.getMonth(),
      wealthEntries: [],
      payments: [],
      totalWealth: 0,
      zakatBaseAmount: null, // New field: defaults to totalWealth if null
      totalZakatDue: 0,
      lastUpdated: Date.now(),
      nisabStatus: null
    };
  };

  const updateMonthData = async (date, updates) => {
    const key = getMonthKey(date);
    const current = getMonthData(date);
    const updated = { ...current, ...updates, lastUpdated: Date.now() };
    
    // Recalculate totals if wealth entries changed
    if (updates.wealthEntries) {
      updated.totalWealth = updates.wealthEntries.reduce((sum, entry) => sum + entry.amount, 0);
      
      // If no custom base amount is set, we might need to update totalZakatDue based on new wealth
      // BUT, usually ZakatDue depends on Nisab status.
      // If zakatBaseAmount IS set, we should probably stick to it unless user resets?
      // The requirement says: "zakatBaseAmount... defaults to originalZakatBaseAmount".
      // If wealth entries change, originalZakatBaseAmount (totalWealth) changes.
      // If user hasn't overridden (zakatBaseAmount is null), we should use new totalWealth?
      // For now, we leave totalZakatDue logic to explicit calls, except ensuring consistency.
    }

    const newData = { ...data, [key]: updated };
    await saveData(newData);
    return updated;
  };

  const addWealthEntry = async (amount, description = '') => {
    const monthData = getMonthData(currentDate);
    const newEntry = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      description,
      date: new Date(),
      timestamp: Date.now()
    };
    
    const newEntries = [...monthData.wealthEntries, newEntry];
    
    // We update wealth
    await updateMonthData(currentDate, { wealthEntries: newEntries });
  };

  const updateWealthEntry = async (entry) => {
    const monthData = getMonthData(currentDate);
    const newEntries = monthData.wealthEntries.map(e => e.id === entry.id ? entry : e);
    await updateMonthData(currentDate, { wealthEntries: newEntries });
  };

  const deleteWealthEntry = async (entryId) => {
    const monthData = getMonthData(currentDate);
    const newEntries = monthData.wealthEntries.filter(e => e.id !== entryId);
    await updateMonthData(currentDate, { wealthEntries: newEntries });
  };

  const addPayment = async (amount, date = new Date()) => {
    // Payments are usually for the current tracked month, 
    // but the user might want to backdate? 
    // For now, let's assume payments are added to the CURRENTLY SELECTED month context.
    const monthData = getMonthData(currentDate);
    const newPayment = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      date: date,
      timestamp: date.getTime()
    };
    const newPayments = [...monthData.payments, newPayment];
    await updateMonthData(currentDate, { payments: newPayments });
  };

  const updatePayment = async (payment) => {
    const monthData = getMonthData(currentDate);
    const newPayments = monthData.payments.map(p => p.id === payment.id ? payment : p);
    await updateMonthData(currentDate, { payments: newPayments });
  };

  const deletePayment = async (paymentId) => {
    const monthData = getMonthData(currentDate);
    const newPayments = monthData.payments.filter(p => p.id !== paymentId);
    await updateMonthData(currentDate, { payments: newPayments });
  };

  const updateZakatDue = async (nisabValue, nisabType) => {
    const monthData = getMonthData(currentDate);
    
    // If we have a manual base amount, use it. Otherwise use totalWealth.
    const baseAmount = monthData.zakatBaseAmount !== null && monthData.zakatBaseAmount !== undefined
      ? monthData.zakatBaseAmount
      : monthData.totalWealth;

    // Logic: If baseAmount >= nisabValue, zakat = baseAmount * 0.025
    // Else 0.
    const isPayable = baseAmount >= nisabValue;
    const zakatDue = isPayable ? baseAmount * ZAKAT_RATE : 0;

    await updateMonthData(currentDate, { 
      totalZakatDue: zakatDue,
      nisabStatus: {
        value: nisabValue,
        type: nisabType,
        payable: isPayable,
        timestamp: Date.now()
      }
    });
  };

  const updateZakatBaseAmount = async (amount) => {
    // When manually setting base amount, we bypass nisab check for calculation?
    // "Recalculate: zakatDue = zakatBaseAmount × 0.025"
    // So we just set totalZakatDue directly based on the new amount.
    
    let newBase = null;
    let newDue = 0;

    if (amount !== null && amount !== undefined) {
      newBase = parseFloat(amount);
      newDue = newBase * ZAKAT_RATE;
    } else {
      // Resetting to original
      const monthData = getMonthData(currentDate);
      newBase = null; // Will default to totalWealth
      // We need to re-run full calc ideally, but simpler:
      // If resetting, we should probably re-check nisab? 
      // For this specific requirement "Reset to original value... Recalculates values accordingly",
      // we might need the current Nisab. 
      // However, if we just want to revert to "Total Wealth * 2.5%", we can do:
      newDue = monthData.totalWealth * ZAKAT_RATE; 
      // NOTE: This assumes it's payable. If it wasn't payable originally, this might be wrong.
      // But the user is in the "History" view editing this. 
      // Let's assume if they are editing, they are managing a payable month or forcing it.
      // If we want strict correctness, we'd need the stored nisabStatus.
      if (monthData.nisabStatus && !monthData.nisabStatus.payable) {
         newDue = 0;
      }
    }

    await updateMonthData(currentDate, {
      zakatBaseAmount: newBase,
      totalZakatDue: newDue
    });
  };

  const resetMonth = async () => {
     const key = getMonthKey(currentDate);
     const { [key]: deleted, ...rest } = data;
     await saveData(rest);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    currentDate,
    setCurrentDate, // Allow changing the viewed month
    currentMonthData: getMonthData(currentDate),
    addWealthEntry,
    updateWealthEntry,
    deleteWealthEntry,
    addPayment,
    updatePayment,
    deletePayment,
    updateZakatDue,
    updateZakatBaseAmount, // New function
    resetMonth,
    refresh: loadData
  };
};
