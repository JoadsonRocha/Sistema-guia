export const maskCurrency = (value: string) => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const amount = (Number(digits) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2
  });
  return amount;
};

export const parseCurrencyToNumber = (value: string) => {
  return Number(value.replace(/\D/g, '')) / 100;
};
