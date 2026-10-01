const MONEY_PATTERN = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/;

export function parseMoneyToCents(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = MONEY_PATTERN.exec(value.trim());
  if (!match) return null;

  const whole = BigInt(match[1]);
  const decimal = (match[2] ?? "").padEnd(2, "0");
  const cents = whole * BigInt(100) + BigInt(decimal || "0");
  if (cents <= BigInt(0) || cents > BigInt(Number.MAX_SAFE_INTEGER))
    return null;
  return Number(cents);
}

export function numberToCents(value: number) {
  const cents = Math.round(value * 100);
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new Error("El importe monetario no es válido");
  }
  return cents;
}

export function getMinimumNextBidCents(
  basePriceCents: number,
  currentBidCents: number | null,
) {
  if (currentBidCents === null) return basePriceCents + 1;
  return Number(
    (BigInt(currentBidCents) * BigInt(110) + BigInt(99)) / BigInt(100),
  );
}
