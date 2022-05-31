export function rankNameToNumber(name: string) {
  const [number, level] = name.split(' ');
  return level === 'kyu' ? -number : number;
}

export function rankNumberToName(number: number) {
  return number < 0 ? -number + ' kyu' : number + ' dan';
}

export function dateToYYYYMMDD(date: Date) {
  return `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date
    .getUTCDate()
    .toString()
    .padStart(2, '0')}`;
}