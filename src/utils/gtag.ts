// Google Ads conversion tracking helper

export const GOOGLE_ADS_CONVERSION_ID = 'AW-18353346138/WwU2CPSZmNccENqsx69E';

export const trackAdsConversion = (value: number = 1.0, transactionId: string = '') => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'conversion', {
      send_to: GOOGLE_ADS_CONVERSION_ID,
      value: value,
      currency: 'BRL',
      transaction_id: transactionId,
    });
    console.log('Google Ads conversion event tracked:', GOOGLE_ADS_CONVERSION_ID);
  }
};
