function validateCNPJ(cnpj) {
  const c = cnpj.replace(/\D/g, '');
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
  let size = c.length - 2, numbers = c.substring(0, size), digits = c.substring(size), sum = 0, pos = size - 7;
  for (let i = size; i >= 1; i--) { sum += numbers.charAt(size - i) * pos--; if (pos < 2) pos = 9; }
  let r = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (r !== parseInt(digits.charAt(0))) return false;
  size += 1; numbers = c.substring(0, size); sum = 0; pos = size - 7;
  for (let i = size; i >= 1; i--) { sum += numbers.charAt(size - i) * pos--; if (pos < 2) pos = 9; }
  r = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return r === parseInt(digits.charAt(1));
}

function validateCPF(cpf) {
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(c.charAt(i)) * (10 - i);
  let rev = 11 - (sum % 11); if (rev >= 10) rev = 0;
  if (rev !== parseInt(c.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(c.charAt(i)) * (11 - i);
  rev = 11 - (sum % 11); if (rev >= 10) rev = 0;
  return rev === parseInt(c.charAt(10));
}

function validateName(n) {
  if (!n || n.trim().length < 3) return false;
  if (/^\d+$/.test(n)) return false;
  return !/[^a-zA-ZÀ-ÿ\s.\-']/.test(n);
}

const cnpjValidator = { options: v => { if (!validateCNPJ(v)) throw new Error('CNPJ inválido.'); return true; } };
const cpfValidator = { options: v => { if (!validateCPF(v)) throw new Error('CPF inválido.'); return true; } };
const nameValidator = { options: v => { if (!validateName(v)) throw new Error('Nome inválido.'); return true; } };

module.exports = { validateCNPJ, validateCPF, validateName, cnpjValidator, cpfValidator, nameValidator };
