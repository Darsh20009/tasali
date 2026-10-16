import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import type { Order } from "@shared/schema";
import { brand } from "@/lib/brand";
import { useRef, useState, useEffect } from "react";
import QRCode from "qrcode";
import { fmtOrderNum, printHtmlInPage, isAndroidDevice } from "@/lib/print-utils";
import { useTranslate } from "@/lib/useTranslate";
import {
  getReceiptTemplateVisibility,
  loadReceiptTemplateSettings,
  RECEIPT_CAMPAIGN_IMAGE,
  renderReceiptCustomElements,
  shouldShowReceiptCampaign,
  type ReceiptTemplateSettings,
  type RenderedReceiptCustomElement,
} from "@/lib/receipt-template-settings";
import { loadPrinterSettings } from "@/lib/thermal-printer";

interface ReceiptInvoiceProps {
  order: Order;
  variant?: "button" | "auto";
  precomputedTrackingQr?: string;
  precomputedZatcaQr?: string;
}

function parseNum(v: any): number {
  const n = parseFloat(String(v || 0));
  return isNaN(n) ? 0 : n;
}

function Sar() {
  return (
    <span style={{ fontWeight: 700, fontFamily: "Arial, sans-serif", fontSize: "0.9em" }}>
      SAR
    </span>
  );
}

export function ReceiptInvoice({ order, variant = "button", precomputedTrackingQr, precomputedZatcaQr }: ReceiptInvoiceProps) {
  const tc = useTranslate();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [trackingQrUrl, setTrackingQrUrl] = useState<string>(precomputedTrackingQr || "");
  const [zatcaQrUrl, setZatcaQrUrl] = useState<string>(precomputedZatcaQr || "");
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [paperWidth] = useState<"58mm" | "80mm">(() => loadPrinterSettings().paperWidth);
  const paperWidthPx = paperWidth === "58mm" ? 219 : 300;
  const [templateSettings] = useState<ReceiptTemplateSettings>(loadReceiptTemplateSettings);
  const receiptVisibility = getReceiptTemplateVisibility(templateSettings);
  const [customElements, setCustomElements] = useState<RenderedReceiptCustomElement[]>([]);
  const [customElementsReady, setCustomElementsReady] = useState(false);

  useEffect(() => {
    fetch("/api/public/settings")
      .then((res) => res.ok ? res.json() : {})
      .then((settings: any) => setTrackingEnabled(settings.orderTrackingEnabled === true && receiptVisibility.trackingCode))
      .catch(() => setTrackingEnabled(false));
  }, [receiptVisibility.trackingCode]);

  const getItemsArray = (): any[] => {
    try {
      if (!order?.items) return [];
      if (Array.isArray(order.items)) return order.items;
      if (typeof order.items === "string") {
        const p = JSON.parse(order.items);
        return Array.isArray(p) ? p : [];
      }
      if (typeof order.items === "object") return Object.values(order.items as any);
      return [];
    } catch { return []; }
  };

  const items = getItemsArray();
  const safeOrder = (order || {}) as any;
  const totalAmount = parseNum(safeOrder.totalAmount);
  const subtotal = totalAmount / 1.15;
  const vat = totalAmount - subtotal;

  useEffect(() => {
    if (!order?.orderNumber || templateSettings.mode !== "custom") {
      setCustomElements([]);
      setCustomElementsReady(true);
      return;
    }
    let cancelled = false;
    setCustomElementsReady(false);
    const createdAt = safeOrder.createdAt ? new Date(safeOrder.createdAt) : new Date();
    renderReceiptCustomElements(templateSettings, {
      orderNumber: String(order.orderNumber).replace(/\D/g, "").padStart(4, "0"),
      invoiceNumber: `INV-${order.orderNumber}`,
      total: totalAmount.toFixed(2),
      date: createdAt.toLocaleString("ar-SA"),
    }).then((rendered) => {
      if (cancelled) return;
      setCustomElements(rendered);
      setCustomElementsReady(true);
    }).catch(() => {
      if (cancelled) return;
      setCustomElements([]);
      setCustomElementsReady(true);
    });
    return () => { cancelled = true; };
  }, [order?.orderNumber, safeOrder.createdAt, totalAmount, templateSettings]);

  // Step 1: Generate QR codes
  useEffect(() => {
    if (!order?.orderNumber) return;
    (async () => {
      try {
        if (trackingEnabled) {
          const url = `${window.location.origin}/track/${encodeURIComponent(String(order.orderNumber))}`;
          setTrackingQrUrl(await QRCode.toDataURL(url, { width: 200, margin: 1, errorCorrectionLevel: "M" }));
        } else {
          setTrackingQrUrl("");
        }
      } catch {}
      try {
        const vatNum = brand.taxNumber || "";
        const payload = btoa(`\x01\x10${brand.shortNameAr}\x02\x0F${vatNum}\x03\x14${new Date(order.createdAt).toISOString()}\x04\x08${totalAmount.toFixed(2)}\x05\x08${vat.toFixed(2)}`);
        setZatcaQrUrl(await QRCode.toDataURL(payload, { width: 180, margin: 1, errorCorrectionLevel: "M" }));
      } catch {}
    })();
  }, [order?.orderNumber, trackingEnabled, templateSettings.visibility.trackingCode]);

  if (!order?.orderNumber) return null;

  const orderNum = String(order.orderNumber).replace(/\D/g, "").padStart(4, "0");
  const createdAt = new Date(order.createdAt);
  const dateStr = `${createdAt.getDate().toString().padStart(2, "0")}.${(createdAt.getMonth() + 1).toString().padStart(2, "0")}.${createdAt.getFullYear()}`;
  const timeStr = createdAt.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  const orderTypeLabel = (() => {
    const t = safeOrder.deliveryType || safeOrder.orderType || "";
    if (t === "dine_in" || t === "dine-in") return safeOrder.tableNumber ? `محلي — طاولة ${safeOrder.tableNumber}` : "محلي";
    if (t === "takeaway" || t === "pickup") return "سفري";
    if (t === "car_pickup" || t === "car-pickup") return "استلام بالسيارة";
    if (t === "delivery") return "توصيل";
    return "محلي";
  })();

  const paymentLabel = (() => {
    const m = (safeOrder.paymentMethod || "").toLowerCase();
    const sub = (safeOrder.paymentSubMethod || safeOrder.cardBrand || "").toLowerCase();
    if (m === "cash") return "نقدي";
    if (m === "card" || m === "network" || m === "pos" || m === "pos-network") return "شبكة";
    if (m === "loyalty" || m === "qirox-card" || m === "qahwa-card") return "بطاقة ولاء";
    // Apple Pay — detect via method OR sub-method OR gateway sub-method
    if (m === "apple_pay" || m === "neoleap-apple-pay" || m === "paymob-apple-pay" ||
        sub === "apple_pay" || sub === "applepay" || sub.includes("apple")) return "Apple Pay";
    if (m === "geidea") {
      if (sub === "apple_pay" || sub.includes("apple")) return "Apple Pay";
      if (sub === "mada") return "مدى";
      return "بطاقة ائتمان";
    }
    if (m === "paymob" || m === "paymob-card") return "بطاقة ائتمان";
    if (m === "mada" || m === "bank_transfer") return "تحويل بنكي";
    if (m === "rajhi") return "بنك الراجحي";
    if (m === "alinma") return "Alinma Pay";
    if (m === "stc-pay") return "STC Pay";
    if (m === "split") return "نقدي + شبكة";
    if (!m || m === "undefined") return "نقدي";
    return m;
  })();

  const totalQty = items.reduce((s: number, i: any) => s + (i.quantity || 1), 0);

  // Build a stand-alone HTML doc by cloning the on-screen invoice — vector text, instant.
  const buildPrintDoc = (): string => {
    const el = invoiceRef.current;
    if (!el) return "";
    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.margin = "0 auto";
    clone.style.width = showCampaignImage ? paperWidth : `${paperWidthPx}px`;
    return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<title>فاتورة ${order.orderNumber}</title>
<style>
  @page { size: ${paperWidth} auto; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  html, body { margin: 0; padding: 0; background: #fff; font-family: 'Cairo','Tajawal',Tahoma,Arial,sans-serif; }
  body { padding: ${showCampaignImage ? "0" : "4mm 2mm"}; }
  img { max-width: 100%; }
</style></head><body>${clone.outerHTML}</body></html>`;
  };

  // ── Pre-rendered hidden print iframe — desktop/iOS only.
  //    On Android we NEVER create a staged iframe because any iframe in the DOM
  //    (even hidden at top:-9999px) causes Android Chrome/WebView to recalculate
  //    the page viewport to match the iframe's narrow paper width, shrinking the
  //    entire UI. Android uses window.print() via printHtmlInPage() instead.
  const printIframeRef = useRef<HTMLIFrameElement | null>(null);
  const [printReady, setPrintReady] = useState(false);

  useEffect(() => {
    // Skip staged iframe on Android — we use the no-iframe path
    if (isAndroidDevice) { setPrintReady(customElementsReady); return; }
    if (templateSettings.mode === "custom" && !customElementsReady) return;
    // Wait until both QR codes are generated before staging the iframe
    if ((trackingEnabled && !trackingQrUrl) || !zatcaQrUrl || !invoiceRef.current) return;
    if (printIframeRef.current) return; // already staged

    let cancelled = false;
    (async () => {
      // Wait for the on-screen invoice images (logo + QR) to actually paint
      const deadline = Date.now() + 4000;
      while (Date.now() < deadline) {
        const el = invoiceRef.current;
        if (!el) return;
        const imgs = Array.from(el.querySelectorAll("img")) as HTMLImageElement[];
        if (imgs.every((i) => i.complete && i.naturalWidth > 0)) break;
        await new Promise((r) => setTimeout(r, 60));
      }
      if (cancelled) return;

      const html = buildPrintDoc();
      if (!html) return;
      const iframe = document.createElement("iframe");
      iframe.setAttribute("aria-hidden", "true");
      iframe.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;width:302px;height:1px;border:none;opacity:0;pointer-events:none;";
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument!;
      doc.open();
      doc.write(html);
      doc.close();

      // Wait for iframe images to load, then mark ready
      const innerDeadline = Date.now() + 3000;
      while (Date.now() < innerDeadline) {
        const imgs = Array.from(doc.querySelectorAll("img")) as HTMLImageElement[];
        if (imgs.length === 0 || imgs.every((i) => i.complete && i.naturalWidth > 0)) break;
        await new Promise((r) => setTimeout(r, 50));
      }
      if (cancelled) {
        try { iframe.remove(); } catch {}
        return;
      }
      printIframeRef.current = iframe;
      setPrintReady(true);
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingEnabled, trackingQrUrl, zatcaQrUrl, customElementsReady, templateSettings.mode, paperWidth]);

  // Cleanup the staged iframe on unmount
  useEffect(() => {
    return () => {
      try { printIframeRef.current?.remove(); } catch {}
      printIframeRef.current = null;
    };
  }, []);

  // Print handler:
  //   Android → no-iframe path via printHtmlInPage (avoids viewport shrinkage)
  //   Desktop/iOS → staged iframe for zero-delay synchronous print
  const printReceipt = async (): Promise<void> => {
    const html = buildPrintDoc();
    if (!html) return;

    // Android: inject into main document and call window.print() — no iframe
    if (isAndroidDevice) {
      printHtmlInPage(html, '80mm');
      return;
    }

    // Desktop / iOS: use staged iframe if ready, else build on demand
    const staged = printIframeRef.current;
    if (staged && staged.contentWindow) {
      try { staged.contentWindow.focus(); staged.contentWindow.print(); } catch {}
      return;
    }
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText =
      "position:fixed;top:-9999px;left:-9999px;width:302px;height:1px;border:none;opacity:0;pointer-events:none;";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(html);
    doc.close();
    await new Promise((r) => setTimeout(r, 80));
    try { iframe.contentWindow!.focus(); iframe.contentWindow!.print(); } catch {}
    const cleanup = () => { try { iframe.remove(); } catch {} };
    iframe.contentWindow?.addEventListener("afterprint", cleanup, { once: true });
    setTimeout(cleanup, 8000);
  };

  // Save as PDF — opens the browser's native print dialog where the user picks "Save as PDF".
  const generatePDF = async () => {
    await printReceipt();
  };

  useEffect(() => {
    if (variant !== "auto" || !(order?.id || order?.orderNumber)) return;
    if (!printReady) return;
    // If a hardware thermal printer is configured, printTaxInvoice() already
    // handled printing this receipt.  Firing window.print() here too would:
    //   • produce a duplicate paper receipt for every customer (all devices)
    //   • freeze the POS UI on Android (synchronous window.print() blocks JS)
    // Only fall through to browser print when no thermal printer is configured
    // (i.e., the operator is using a regular desktop printer or "browser" mode).
    const thermalConfigured = (() => {
      try {
        const stored = localStorage.getItem('qirox-printer-settings');
        if (!stored) return false;
        const ps = JSON.parse(stored);
        return Boolean(ps.enabled && ps.mode && ps.mode !== 'browser');
      } catch { return false; }
    })();
    if (thermalConfigured) return;
    // On Android WebView, window.print() blocks the entire JS thread
    // synchronously — NEVER call it automatically. The thermal printer is
    // the only non-blocking print path on Android.  If thermal is not
    // configured, the cashier must press the print button manually or
    // configure a thermal printer in settings.
    if (isAndroidDevice) return;
    const t = setTimeout(() => { printReceipt(); }, 50);
    return () => clearTimeout(t);
  }, [variant, order?.id, order?.orderNumber, printReady]);

  /* ─── style helpers ─── */
  const cell = (extra?: React.CSSProperties): React.CSSProperties => ({ padding: "3px 0", fontSize: "13px", lineHeight: "1.7", ...extra });
  const bold = (extra?: React.CSSProperties): React.CSSProperties => ({ fontWeight: 700, ...extra });
  const dash = (): React.CSSProperties => ({ borderTop: "1px dashed #aaa", margin: "10px 0" });
  const isCustom = templateSettings.mode === "custom";
  const showCampaignImage = shouldShowReceiptCampaign(templateSettings);
  const renderCustomElements = (placement: "afterOrderInfo" | "footer") => customElements
    .filter((element) => element.placement === placement)
    .map((element) => (
      <div key={element.id} style={{ textAlign: "center", padding: "6px 4px", breakInside: "avoid" }}>
        {element.label && <div style={{ fontSize: "11px", fontWeight: 900, marginBottom: "4px" }}>{element.label}</div>}
        {element.imageDataUrl && (
          <img
            src={element.imageDataUrl}
            alt={element.label || element.kind}
            style={{ display: "block", maxWidth: element.kind === "barcode" ? "85%" : "40%", maxHeight: "100px", width: "auto", height: "auto", margin: "4px auto" }}
          />
        )}
        {(element.kind === "text" || !element.imageDataUrl || element.kind === "link") && (
          <div style={{ fontSize: "10px", direction: element.kind === "link" || element.kind === "barcode" ? "ltr" : "rtl", wordBreak: "break-all" }}>
            {element.renderedValue}
          </div>
        )}
      </div>
    ));

  return (
    <div className="space-y-4">
      <div
        ref={invoiceRef}
        data-testid="invoice-preview"
        style={{
          direction: "rtl",
          fontFamily: "'Cairo', 'Tajawal', Tahoma, Arial, sans-serif",
          background: "#fff",
          color: "#000",
          width: `${paperWidthPx}px`,
          margin: "0 auto",
          padding: "0",
          fontSize: "13px",
          lineHeight: 1.5,
          fontWeight: 700,
        }}
      >
        {!showCampaignImage && <div style={{ height: "20px" }} />}

        {showCampaignImage && (
          <img
            src={RECEIPT_CAMPAIGN_IMAGE}
            alt="صورة الحملة"
            style={{ display: "block", width: "100%", height: "auto", margin: 0, objectFit: "contain" }}
          />
        )}

        {/* The campaign layout places the order number directly below the full-width artwork. */}
        <div style={{ textAlign: "center", fontWeight: 900, fontSize: "22px", letterSpacing: "2px", padding: showCampaignImage ? "6px 0" : "10px 0 6px" }}>
          #{orderNum}
        </div>

        {/* ── 2. Logo ── */}
        {!showCampaignImage && (!isCustom || templateSettings.visibility.brandHeader) && <div style={{ padding: "6px 0 10px", marginBottom: "4px" }}>
          <img
            src="/logo.png"
            alt="تسالي كرومش"
            crossOrigin="anonymous"
            style={{ width: "200px", height: "auto", display: "block", margin: "0 auto" }}
          />
        </div>}

        {/* ── 3. Business info ── */}
        <div style={{ textAlign: "center", fontSize: "12px", lineHeight: "1.9", marginBottom: "8px" }}>
          {(!isCustom || templateSettings.visibility.brandHeader) && <div style={{ fontWeight: 900, fontSize: "15px" }}>تسالي كرومش</div>}
          {isCustom && templateSettings.visibility.website && <div style={{ fontSize: "10px", direction: "ltr" }}>{brand.website}</div>}
          {brand.taxNumber && <div style={{ direction: "ltr", fontSize: "11px", color: "#444" }}>الرقم الضريبي: {brand.taxNumber}</div>}
          <div style={{ direction: "ltr", fontSize: "11px", color: "#444" }}>{timeStr} · {dateStr}</div>
          {(!isCustom || templateSettings.visibility.orderDetails) && <div style={{ fontWeight: 700, fontSize: "13px", marginTop: "3px", background: "#f0f0f0", padding: "2px 8px", display: "inline-block", borderRadius: "4px" }}>
            {orderTypeLabel}
          </div>}
        </div>

        {/* ── 4. Cashier ── */}
        {(!isCustom || templateSettings.visibility.orderDetails) && safeOrder.employeeName && (
          <div style={{ textAlign: "center", fontSize: "11px", color: "#555", marginBottom: "4px" }}>
            الكاشير: <strong>{safeOrder.employeeName}</strong>
          </div>
        )}

        {isCustom && templateSettings.visibility.customer && safeOrder.customerName && safeOrder.customerName !== "عميل نقدي" && (
          <div style={{ textAlign: "center", fontSize: "11px", color: "#555", marginBottom: "4px" }}>
            العميل: <strong>{safeOrder.customerName}</strong>
          </div>
        )}

        {renderCustomElements("afterOrderInfo")}

        {/* ── 5. Items header ── */}
        <div style={dash()} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#555", fontWeight: 700, padding: "2px 0 3px" }}>
          <span>السعر</span>
          <span>المنتج</span>
        </div>
        <div style={dash()} />

        {/* ── 6. Items list (bilingual) ── */}
        {items.map((item: any, idx: number) => {
          const nameAr = item.nameAr || item.coffeeItem?.nameAr || item.name || "";
          const nameEn = item.nameEn || item.coffeeItem?.nameEn || "";
          const qty = item.quantity || 1;
          const unitPrice = parseNum(item.price ?? item.coffeeItem?.price ?? 0);
          const lineTotal = unitPrice * qty;
          const selectedSize = item.selectedSize || item.coffeeItem?.selectedSize || "";
          const addons: string[] = item.customization?.selectedItemAddons?.map((a: any) => a.nameAr).filter(Boolean) || [];
          return (
            <div key={idx} style={{ marginBottom: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", ...cell() }}>
                <span style={{ fontFamily: "Arial, sans-serif", fontWeight: 700, fontSize: "11px", flexShrink: 0, whiteSpace: "nowrap" }}>
                  SAR {lineTotal.toFixed(2)}
                </span>
                <div style={{ textAlign: "right", paddingRight: "6px" }}>
                  <div style={{ fontWeight: 700 }}>{qty}× {nameAr}</div>
                  {nameEn ? <div style={{ fontSize: "11px", color: "#666", direction: "ltr", textAlign: "right" }}>{nameEn}</div> : null}
                  {selectedSize ? <div style={{ fontSize: "11px", color: "#555" }}>الحجم: {selectedSize}</div> : null}
                  {addons.map((a, i) => <div key={i} style={{ fontSize: "11px", color: "#555" }}>+ {a}</div>)}
                </div>
              </div>
            </div>
          );
        })}

        {/* ── 7. Item count ── */}
        <div style={dash()} />
        <div style={{ textAlign: "center", fontSize: "11px", color: "#333", padding: "2px 0" }}>
          عدد المنتجات: {totalQty}
        </div>
        <div style={dash()} />

        {/* ── 8. Totals ── */}
        {[
          { label: "المجموع الفرعي", value: subtotal.toFixed(2) },
          { label: "ضريبة القيمة المضافة (15%)", value: vat.toFixed(2) },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", ...cell({ fontSize: "12px" }) }}>
            <span style={{ fontFamily: "Arial, sans-serif" }}>SAR {value}</span>
            <span>{label}</span>
          </div>
        ))}

        {/* Grand total */}
        <div style={{ display: "flex", justifyContent: "space-between", ...cell(bold({ fontSize: "16px", borderTop: "2px solid #000", paddingTop: "8px", marginTop: "10px" })) }}>
          <span style={{ fontFamily: "Arial, sans-serif", fontWeight: 900 }}>SAR {totalAmount.toFixed(2)}</span>
          <span>المجموع الكلي</span>
        </div>

        {/* Payment method */}
        {(!isCustom || templateSettings.visibility.payment) && <div style={{ display: "flex", justifyContent: "space-between", ...cell({ fontSize: "12px", paddingTop: "4px" }) }}>
          <span style={{ fontFamily: "Arial, sans-serif" }}>SAR {totalAmount.toFixed(2)}</span>
          <span>طريقة الدفع: {paymentLabel}</span>
        </div>}

        <div style={dash()} />

        {/* ── 8b. ملاحظات العميل ── */}
        {(() => {
          let notesText = safeOrder.notes;
          if (!notesText) return null;
          // Guard: if notes was accidentally stored as an object, stringify it safely
          if (typeof notesText === "object") {
            try { notesText = JSON.stringify(notesText); } catch { notesText = ""; }
          }
          notesText = String(notesText).trim();
          if (!notesText) return null;
          return (
            <div style={{ background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: "6px", padding: "8px 10px", margin: "4px 0 8px", fontSize: "12px", lineHeight: "1.9", direction: "rtl", textAlign: "right" }}>
              <div style={{ fontWeight: 900, color: "#92400e", marginBottom: "3px" }}>📝 ملاحظات العميل:</div>
              <div style={{ color: "#78350f", fontWeight: 700, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "'Cairo', 'Tajawal', Tahoma, Arial, sans-serif" }}>
                {notesText}
              </div>
            </div>
          );
        })()}

        {/* ── 9. Tagline ── */}
        {(!isCustom || templateSettings.visibility.footer) && <>
          <div style={{ textAlign: "center", fontSize: "13px", fontWeight: 700, padding: "2px 0 4px" }}>
            "تسالي وكرومش .. لكل لحظة نكهة"
          </div>
          <div style={{ textAlign: "center", fontSize: "11px", color: "#555", paddingBottom: "8px" }}>تسالي كرومش</div>
        </>}

        {/* ── 10. Tracking QR barcode — small on right with text beside it ── */}
        {trackingEnabled && trackingQrUrl && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", padding: "6px 4px 4px", direction: "rtl" }}>
            <img src={trackingQrUrl} alt="Tracking QR" style={{ width: "65px", height: "65px", flexShrink: 0 }} />
            <div style={{ textAlign: "right", lineHeight: "1.7" }}>
              <div style={{ fontSize: "12px", fontWeight: 900, color: "#111" }}>باركود تتبع الطلب</div>
              <div style={{ fontSize: "10px", color: "#555" }}>امسح لتتبع طلبك</div>
              <div style={{ fontSize: "10px", color: "#555" }}>وتسجيل الدخول</div>
            </div>
          </div>
        )}

        <div style={{ borderTop: "1px dashed #ccc", margin: "8px 0" }} />

        {/* ── 11. ZATCA QR barcode ── */}
        {zatcaQrUrl && (
          <div style={{ textAlign: "center", padding: "6px 0 10px" }}>
            <div style={{ fontSize: "12px", fontWeight: 900, color: "#111", marginBottom: "6px" }}>
              الفاتورة الضريبية
            </div>
            <img src={zatcaQrUrl} alt="ZATCA QR" style={{ width: "120px", height: "120px", display: "inline-block" }} />
            <div style={{ fontSize: "10px", color: "#555", marginTop: "4px", fontFamily: "Arial, sans-serif" }}>
              فاتورة ضريبية
            </div>
          </div>
        )}

        {/* ── 12. Powered by ── */}
        {(!isCustom || templateSettings.visibility.footer) && (
          <div style={{ borderTop: "1px dashed #ccc", textAlign: "center", padding: "10px 0", marginTop: "4px", fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#555", letterSpacing: "0.3px" }}>
            Powered by QIROX STUDIO
          </div>
        )}

        <div style={{ height: "16px" }} />
      </div>

      {/* ─── Action Buttons ─── */}
      {variant === "button" && (
        <div className="flex gap-2 w-full no-print">
          <Button onClick={printReceipt} disabled={!printReady} className="flex-1 bg-primary hover:bg-primary/90" data-testid="button-print-invoice">
            <Printer className="ml-2 h-4 w-4" />
            {tc("طباعة الفاتورة", "Print Invoice")}
          </Button>
          <Button onClick={generatePDF} disabled={!printReady} variant="outline" className="flex-1" data-testid="button-download-invoice">
            <Download className="ml-2 h-4 w-4" />
            {tc("حفظ PDF", "Save PDF")}
          </Button>
        </div>
      )}
    </div>
  );
}
