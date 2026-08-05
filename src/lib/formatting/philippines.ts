const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const manilaDate = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const compactNumber = new Intl.NumberFormat("en-PH", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const formatPeso = (value: number) => peso.format(value);
export const formatManilaDate = (value: Date | string) =>
  manilaDate.format(typeof value === "string" ? new Date(value) : value);
export const formatCompactNumber = (value: number) => compactNumber.format(value);
