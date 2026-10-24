// UNiCOM Console — connector layer types (WAVE-1 FROZEN, base commit).
// Owner: TL. C1 implements adapters against this interface; C3 imports only
// executeDecisionPayload from ../execute. Do not modify this file — propose
// changes via your COMPLETION REPORT.
//
// FetchLike injection is how tests fake the network: every adapter method
// takes fetchImpl; production call sites pass the global `fetch`.

export type PlatformId =
  | "shopify"
  | "woocommerce"
  | "etsy"
  | "amazon"
  | "squarespace"
  | "bigcommerce";

export type ConnectMode = "oauth" | "key" | "demo";

export interface ConnectInput {
  platform: PlatformId;
  mode: ConnectMode;
  fields: Record<string, string>;
}

export interface CredentialAuth {
  method: "oauth2" | "key" | "token" | "demo";
  secrets: Record<string, string>;
  meta: Record<string, string>;
}

export interface NormalizedProduct {
  remoteId: string;
  handle: string;
  title: string;
  status: string;
  priceCents: number;
  compareAtCents?: number;
  sku?: string;
  inventory: number;
  imageUrl?: string;
  url?: string;
  raw?: unknown;
}

export interface NormalizedOrder {
  remoteId: string;
  number: string;
  status: string;
  totalCents: number;
  currency: string;
  buyerEmail?: string;
  placedAt: string;
  raw?: unknown;
}

export type VerifyResult =
  | { ok: true; meta: Record<string, string> }
  | { ok: false; error: string; hint?: string };

export type WriteResult = { ok: true } | { ok: false; error: string };

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export interface ConnectorAdapter {
  id: PlatformId;
  verify(input: ConnectInput, fetchImpl: FetchLike): Promise<VerifyResult>;
  fetchProducts(
    auth: CredentialAuth,
    fetchImpl: FetchLike,
    cursor?: string,
  ): Promise<{ items: NormalizedProduct[]; nextCursor?: string }>;
  fetchOrders(
    auth: CredentialAuth,
    fetchImpl: FetchLike,
    since?: string,
  ): Promise<{ items: NormalizedOrder[] }>;
  applyPriceChange(
    auth: CredentialAuth,
    fetchImpl: FetchLike,
    input: { remoteId: string; priceCents: number },
  ): Promise<WriteResult>;
}
