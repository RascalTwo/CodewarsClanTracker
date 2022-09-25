export const flattenDate = (input: any) => {
  const date = new Date(input);
  date.setUTCHours(0);
  date.setUTCMinutes(0);
  date.setUTCSeconds(0);
  date.setUTCMilliseconds(0);
  return date;
};

export function rankNameToNumber(name: string) {
  const [number, level] = name.split(' ');
  return level === 'kyu' ? -number : number;
}

export function rankNumberToName(number: number) {
  return number < 0 ? -number + ' kyu' : number + ' dan';
}


export const getWeekNumber = (date: Date) => {
  const oneJan = new Date(date.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
};

export function dateToYYYYMMDD(date: Date) {
  return `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date
    .getUTCDate()
    .toString()
    .padStart(2, '0')}`;
}

export const copyAndMutate = (date: Date, mutate: (date: Date) => void) => {
  const newDate = new Date(date);
  mutate(newDate);
  return newDate;
};