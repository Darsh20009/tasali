import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { apiRequest } from "@/lib/queryClient";

export const RECEIPT_CAMPAIGN_IMAGE = "/images/invoice-campaign.webp?v=3";

export type ReceiptTemplateMode = "default" | "campaign" | "custom";
export type ReceiptCustomElementKind = "qr" | "barcode" | "link" | "text";
export type ReceiptCustomElementPlacement = "afterOrderInfo" | "footer";

export interface ReceiptCustomElement {
  id: string;
  kind: ReceiptCustomElementKind;
  label: string;
  value: string;
  placement: ReceiptCustomElementPlacement;
  enabled: boolean;
}

export interface ReceiptTemplateSettings {
  mode: ReceiptTemplateMode;
  showCampaignImage: boolean;
  visibility: {
    brandHeader: boolean;
    website: boolean;
    orderDetails: boolean;
    customer: boolean;
    payment: boolean;
    trackingCode: boolean;
    footer: boolean;
  };
  customElements: ReceiptCustomElement[];
}

export interface ReceiptTemplateData {
  orderNumber?: string | number;
  invoiceNumber?: string | number;
  total?: string | number;
  date?: string;
}

export interface RenderedReceiptCustomElement extends ReceiptCustomElement {
  renderedValue: string;
  imageDataUrl?: string;
}

const STORAGE_KEY = "qirox-receipt-template-v1";

export const DEFAULT_RECEIPT_TEMPLATE_SETTINGS: ReceiptTemplateSettings = {
  mode: "default",
  showCampaignImage: true,
  visibility: {
    brandHeader: false,
    website: true,
    orderDetails: true,
    customer: true,
    payment: true,
    trackingCode: true,
    footer: true,
  },
  customElements: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeElement(value: unknown): ReceiptCustomElement | null {
  if (!isRecord(value)) return null;
  const kinds: ReceiptCustomElementKind[] = ["qr", "barcode", "link", "text"];
  const kind = kinds.includes(value.kind as ReceiptCustomElementKind)
    ? value.kind as ReceiptCustomElementKind
    : null;
  if (!kind || typeof value.value !== "string") return null;
  return {
    id: typeof value.id === "string" ? value.id.slice(0, 80) : `${Date.now()}-${Math.random()}`,
    kind,
    label: typeof value.label === "string" ? value.label.slice(0, 80) : "",
    value: value.value.slice(0, 240),
    placement: value.placement === "footer" ? "footer" : "afterOrderInfo",
    enabled: value.enabled !== false,
  };
}

export function normalizeReceiptTemplateSettings(value: unknown): ReceiptTemplateSettings {
  if (!isRecord(value)) return DEFAULT_RECEIPT_TEMPLATE_SETTINGS;
  const visibility = isRecord(value.visibility) ? value.visibility : {};
  const validModes: ReceiptTemplateMode[] = ["default", "campaign", "custom"];
  const mode = validModes.includes(value.mode as ReceiptTemplateMode)
    ? value.mode as ReceiptTemplateMode
    : "default";
  const elements = Array.isArray(value.customElements)
    ? value.customElements.map(normalizeElement).filter((item): item is ReceiptCustomElement => !!item).slice(0, 8)
    : [];

  return {
    mode,
    showCampaignImage: mode === "default" ? true : value.showCampaignImage === true,
    visibility: {
      brandHeader: mode === "default" ? false : visibility.brandHeader !== false,
      website: visibility.website !== false,
      orderDetails: visibility.orderDetails !== false,
      customer: visibility.customer !== false,
      payment: visibility.payment !== false,
      trackingCode: visibility.trackingCode !== false,
      footer: visibility.footer !== false,
    },
    customElements: elements,
  };
}

export function loadReceiptTemplateSettings(): ReceiptTemplateSettings {
  if (typeof window === "undefined") return DEFAULT_RECEIPT_TEMPLATE_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeReceiptTemplateSettings(JSON.parse(raw)) : DEFAULT_RECEIPT_TEMPLATE_SETTINGS;
  } catch {
    return DEFAULT_RECEIPT_TEMPLATE_SETTINGS;
  }
}

function cacheReceiptTemplateSettings(settings: ReceiptTemplateSettings): ReceiptTemplateSettings {
  const normalized = normalizeReceiptTemplateSettings(settings);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (error) {
      console.error("Could not save receipt template settings", error);
    }
  }
  return normalized;
}

export async function fetchSharedReceiptTemplateSettings(): Promise<ReceiptTemplateSettings | null> {
  const response = await apiRequest("GET", "/api/receipt-template-settings");
  const payload = await response.json();
  if (!payload || payload.settings == null) return null;
  return cacheReceiptTemplateSettings(normalizeReceiptTemplateSettings(payload.settings));
}

export async function loadSharedReceiptTemplateSettings(): Promise<ReceiptTemplateSettings> {
  try {
    return (await fetchSharedReceiptTemplateSettings()) ?? loadReceiptTemplateSettings();
  } catch (error) {
    console.warn("Could not load shared receipt template settings; using the last local copy", error);
    return loadReceiptTemplateSettings();
  }
}

export async function saveReceiptTemplateSettings(settings: ReceiptTemplateSettings): Promise<ReceiptTemplateSettings> {
  const normalized = normalizeReceiptTemplateSettings(settings);
  const response = await apiRequest("PUT", "/api/receipt-template-settings", { settings: normalized });
  const payload = await response.json();
  if (!payload || payload.settings == null) {
    throw new Error("The server did not confirm the saved receipt template settings");
  }
  return cacheReceiptTemplateSettings(normalizeReceiptTemplateSettings(payload.settings));
}

export function shouldShowReceiptCampaign(settings: ReceiptTemplateSettings): boolean {
  return settings.mode === "campaign" || settings.showCampaignImage;
}

export function getReceiptTemplateVisibility(settings: ReceiptTemplateSettings) {
  return settings.mode === "custom"
    ? settings.visibility
    : DEFAULT_RECEIPT_TEMPLATE_SETTINGS.visibility;
}

export function resolveReceiptTemplateTokens(value: string, data: ReceiptTemplateData): string {
  const replacements: Record<string, string> = {
    orderNumber: String(data.orderNumber ?? ""),
    invoiceNumber: String(data.invoiceNumber ?? data.orderNumber ?? ""),
    total: String(data.total ?? ""),
    date: String(data.date ?? ""),
  };
  return value.replace(/\{\{\s*(orderNumber|invoiceNumber|total|date)\s*\}\}/g, (_match, key: string) => replacements[key] || "");
}

export function escapeReceiptHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]!);
}

export async function renderReceiptCustomElements(
  settings: ReceiptTemplateSettings,
  data: ReceiptTemplateData,
): Promise<RenderedReceiptCustomElement[]> {
  if (settings.mode !== "custom") return [];
  const enabled = settings.customElements.filter((element) => element.enabled);
  return Promise.all(enabled.map(async (element) => {
    const renderedValue = resolveReceiptTemplateTokens(element.value, data);
    let imageDataUrl: string | undefined;
    try {
      if ((element.kind === "qr" || element.kind === "link") && renderedValue.trim()) {
        if (element.kind === "qr" || /^https?:\/\/\S+$/i.test(renderedValue.trim())) {
          imageDataUrl = await QRCode.toDataURL(renderedValue.trim(), {
            width: 180,
            margin: 1,
            errorCorrectionLevel: "M",
          });
        }
      } else if (element.kind === "barcode" && renderedValue.trim() && typeof document !== "undefined") {
        const canvas = document.createElement("canvas");
        JsBarcode(canvas, renderedValue.trim(), {
          format: "CODE128",
          width: 2,
          height: 56,
          displayValue: false,
          margin: 2,
        });
        imageDataUrl = canvas.toDataURL("image/png");
      }
    } catch {
      // Keep printing the receipt even if a custom code's value is invalid.
    }
    return { ...element, renderedValue, imageDataUrl };
  }));
}
