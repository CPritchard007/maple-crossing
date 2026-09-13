export type CadSentiment = "good" | "bad";

export interface UsdCadQuote {
  rate: number;
  asOf: string;
  sentiment: CadSentiment;
}

interface FrankfurterRateResponse {
  date?: string;
  base?: string;
  quote?: string;
  rate?: number;
}

export const USD_CAD_URL = "https://api.frankfurter.dev/v2/rate/usd/cad";

/** Above parity, US$1 buys more than C$1 — good for Canadians. */
const PARITY = 1;

export function usdCadUrl(): string {
  return import.meta.env.DEV ? "/frankfurter/v2/rate/usd/cad" : USD_CAD_URL;
}

export function cadSentiment(rate: number): CadSentiment {
  return rate > PARITY ? "good" : "bad";
}

export function formatUsdCadRate(rate: number): string {
  return rate.toLocaleString("en-CA", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

export async function fetchUsdCadQuote(): Promise<UsdCadQuote> {
  const response = await fetch(usdCadUrl(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Exchange rate request failed (${response.status})`);
  }

  const payload = (await response.json()) as FrankfurterRateResponse;
  const rate = Number(payload.rate);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Exchange rate response was empty");
  }

  return {
    rate,
    asOf: typeof payload.date === "string" ? payload.date : "",
    sentiment: cadSentiment(rate),
  };
}
