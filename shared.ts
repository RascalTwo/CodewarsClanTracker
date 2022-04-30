export function rankNameToNumber(name: string) {
  const [number, level] = name.split(' ');
  return level === 'kyu' ? -number : number;
}

export function rankNumberToName(number: number) {
  return number < 0 ? -number + ' kyu' : number + ' dan';
}
