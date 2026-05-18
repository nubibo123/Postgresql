export const formatVirtualAccount = (accountNumber) => {
  const padded = (accountNumber || '').toString().padStart(10, '0');
  return `SB-${padded.slice(0, 4)}-${padded.slice(4, 8)}-${padded.slice(8)}`;
};

export const formatAccountNumber = (accountNumber) => {
  const raw = (accountNumber || '').toString().padStart(10, '0');
  return raw.match(/.{1,4}/g)?.join(' ') || raw;
};