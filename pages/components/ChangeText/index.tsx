export function ChangeText({ amount }: { amount: number }) {
  return !amount ? null : amount > 0 ? <sup>+{amount}</sup> : <sub>{amount}</sub>;
}
