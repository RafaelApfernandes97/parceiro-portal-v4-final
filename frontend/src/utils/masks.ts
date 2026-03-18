export function maskCNPJ(value: string): string {
  return value.replace(/\D/g, '').slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function maskCPF(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

export function maskCEP(value: string): string {
  return value.replace(/\D/g, '').slice(0, 8)
    .replace(/^(\d{5})(\d)/, '$1-$2');
}

export function maskTel(value: string): string {
  let v = value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 6) v = v.replace(/^(\d{2})(\d{5})(\d)/, '($1) $2-$3');
  else if (v.length > 2) v = v.replace(/^(\d{2})(\d)/, '($1) $2');
  return v;
}
