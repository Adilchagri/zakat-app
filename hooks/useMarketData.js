import { useState, useCallback } from 'react';

const FALLBACK_USD_MAD = 10.10;
const TROY_OUNCE_IN_GRAMS = 31.1035;

export const useMarketData = () => {
  const [prices, setPrices] = useState({
    goldUSD: null,
    silverUSD: null,
    exchangeRate: null,
    goldMADGram: null,
    silverMADGram: null,
    lastUpdated: null,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMarketData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Gold & Silver Prices (USD per Troy Ounce)
      // Using data-asg.goldprice.org as primary
      let goldUSD = 0;
      let silverUSD = 0;
      
      try {
        const metalRes = await fetch('https://data-asg.goldprice.org/dbXRates/USD');
        const metalData = await metalRes.json();
        if (metalData.items && metalData.items.length > 0) {
          goldUSD = metalData.items[0].xauPrice;
          silverUSD = metalData.items[0].xagPrice;
        } else {
          throw new Error('Invalid metal data format');
        }
      } catch (metalErr) {
        console.warn('Primary metal API failed, trying backup...', metalErr);
        // Backup: api.gold-api.com
        const [gRes, sRes] = await Promise.all([
          fetch('https://api.gold-api.com/price/XAU'),
          fetch('https://api.gold-api.com/price/XAG')
        ]);
        const gData = await gRes.json();
        const sData = await sRes.json();
        goldUSD = gData.price;
        silverUSD = sData.price;
      }

      // 2. Fetch Exchange Rate (USD to MAD)
      let rate = FALLBACK_USD_MAD;
      try {
        const rateRes = await fetch('https://open.er-api.com/v6/latest/USD');
        const rateData = await rateRes.json();
        if (rateData?.rates?.MAD) {
          rate = rateData.rates.MAD;
        }
      } catch (rateErr) {
        console.warn('Forex API failed, using fallback', rateErr);
        // Keep fallback
      }

      // 3. Calculate Local Prices per Gram
      const goldMADGram = (goldUSD * rate) / TROY_OUNCE_IN_GRAMS;
      const silverMADGram = (silverUSD * rate) / TROY_OUNCE_IN_GRAMS;

      setPrices({
        goldUSD,
        silverUSD,
        exchangeRate: rate,
        goldMADGram: parseFloat(goldMADGram.toFixed(2)),
        silverMADGram: parseFloat(silverMADGram.toFixed(2)),
        lastUpdated: new Date(),
      });

    } catch (e) {
      console.error('Market data fetch error:', e);
      setError('Failed to fetch market data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { ...prices, loading, error, refreshPrices: fetchMarketData };
};
