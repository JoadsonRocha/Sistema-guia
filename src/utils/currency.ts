export const maskCurrency = (value: string | number | null | undefined) => {
  if (!value) return '';
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  const amount = (Number(digits) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2
  });
  return amount;
};

export const parseCurrencyToNumber = (value: string | number | null | undefined): number => {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return 0;
  return Number(digits) / 100;
};
