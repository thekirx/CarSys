const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const manilaDateFormatter = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatPeso(value: number): string {
  return pesoFormatter.format(value);
}

export function formatManilaDate(value: Date | string): string {
  return manilaDateFormatter.format(
    typeof value === "string" ? new Date(value) : value,
  );
}
