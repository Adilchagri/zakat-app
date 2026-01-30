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
      // Note: Zakat Due usually depends on Nisab which varies. 
      // We might want to pass the current Nisab threshold to this function or handle it in the UI.
      // For now, we'll just update totalWealth. The UI should call 'calculateZakat' to update 'totalZakatDue'.
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
    
    // We update wealth, but ZakatDue needs to be recalculated with current prices
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
    // Logic: If totalWealth >= nisabValue, zakat = wealth * 0.025
    // Else 0.
    const isPayable = monthData.totalWealth >= nisabValue;
    const zakatDue = isPayable ? monthData.totalWealth * ZAKAT_RATE : 0;

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
    resetMonth,
    refresh: loadData
  };
};
