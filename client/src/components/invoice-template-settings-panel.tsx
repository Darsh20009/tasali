import { useEffect, useState } from "react";
import { ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTranslate } from "@/lib/useTranslate";
import { buildReceiptPreviewHtml } from "@/lib/print-utils";
import {
  fetchSharedReceiptTemplateSettings,
  loadReceiptTemplateSettings,
  RECEIPT_CAMPAIGN_IMAGE,
  saveReceiptTemplateSettings,
  type ReceiptCustomElement,
  type ReceiptCustomElementKind,
  type ReceiptTemplateSettings,
} from "@/lib/receipt-template-settings";

const visibilityOptions = [
  ["brandHeader", "شعار واسم النشاط", "Business logo and name"],
  ["website", "الموقع الإلكتروني", "Website"],
  ["orderDetails", "تفاصيل الطلب والكاشير والطاولة", "Order, cashier, and table details"],
  ["customer", "اسم العميل", "Customer name"],
  ["payment", "طريقة الدفع", "Payment method"],
  ["trackingCode", "باركود تتبع الطلب", "Order-tracking QR code"],
  ["footer", "رسالة الشكر والتذييل", "Thank-you message and footer"],
] as const;

export default function InvoiceTemplateSettingsPanel() {
  const tc = useTranslate();
  const [settings, setSettings] = useState<ReceiptTemplateSettings>(loadReceiptTemplateSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "error" | null>(null);
  const [draftKind, setDraftKind] = useState<ReceiptCustomElementKind>("qr");
  const [draftLabel, setDraftLabel] = useState("");
  const [draftValue, setDraftValue] = useState("");
  const [draftPlacement, setDraftPlacement] = useState<ReceiptCustomElement["placement"]>("afterOrderInfo");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchSharedReceiptTemplateSettings()
      .then((sharedSettings) => {
        if (cancelled) return;
        setSettings(sharedSettings ?? loadReceiptTemplateSettings());
        setLoadError(false);
      })
      .catch((error) => {
        console.error("Could not load shared receipt template settings", error);
        if (cancelled) return;
        setSettings(loadReceiptTemplateSettings());
        setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const commit = (next: ReceiptTemplateSettings) => {
    setSettings(next);
    setSaveState(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveState(null);
    try {
      const saved = await saveReceiptTemplateSettings(settings);
      setSettings(saved);
      setLoadError(false);
      setSaveState("saved");
    } catch (error) {
      console.error("Could not save shared receipt template settings", error);
      setSaveState("error");
    } finally {
      setIsSaving(false);
    }
  };

  const updateElement = (id: string, patch: Partial<ReceiptCustomElement>) => {
    commit({
      ...settings,
      customElements: settings.customElements.map((element) =>
        element.id === id ? { ...element, ...patch } : element,
      ),
    });
  };

  const addElement = () => {
    const value = draftValue.trim();
    if (!value || settings.customElements.length >= 8) return;
    const nextElement: ReceiptCustomElement = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`,
      kind: draftKind,
      label: draftLabel.trim(),
      value,
      placement: draftPlacement,
      enabled: true,
    };
    commit({ ...settings, customElements: [...settings.customElements, nextElement] });
    setDraftLabel("");
    setDraftValue("");
  };

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      buildReceiptPreviewHtml({
        orderNumber: "163",
        date: new Date().toISOString(),
        total: "34.50",
        orderType: "takeaway",
        orderTypeName: "سفري",
        customerName: "عميل تجريبي",
        employeeName: "الكاشير",
        paymentMethod: "cash",
        items: [{
          coffeeItem: { nameAr: "مشروب تجريبي", nameEn: "Sample drink", price: "30.00" },
          quantity: 1,
        }],
      } as any, settings).then((html) => {
        if (cancelled) return;
        setPreviewHtml(html);
        setPreviewError(false);
      }).catch(() => {
        if (!cancelled) setPreviewError(true);
      });
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [settings]);

  const modeOptions = [
    { value: "default" as const, title: "الافتراضي", subtitle: "صورة الحملة ثم رقم الطلب بدون شعار النشاط" },
    { value: "campaign" as const, title: "الحملة", subtitle: "صورة الحملة بعرض الورق" },
    { value: "custom" as const, title: "تخصيص", subtitle: "تحكم بالعناصر وأضف أكوادًا" },
  ];

  return (
    <Card className="border border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ImagePlus className="h-5 w-5 text-primary" />
          {tc("شكل الفاتورة", "Invoice layout")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <p className="text-sm text-muted-foreground" role="status">
            {tc("جارٍ تحميل شكل الفاتورة المحفوظ...", "Loading the saved invoice layout...")}
          </p>
        )}
        <fieldset disabled={isLoading || isSaving} className="contents">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="group" aria-label={tc("قالب الفاتورة", "Invoice template")}>
          {modeOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={settings.mode === option.value ? "default" : "outline"}
              className="h-auto min-h-16 flex-col items-start whitespace-normal py-2 text-right"
              aria-pressed={settings.mode === option.value}
              onClick={() => commit({ ...settings, mode: option.value })}
            >
              <span className="font-semibold">{tc(option.title, option.value === "default" ? "Default" : option.value === "campaign" ? "Campaign" : "Custom")}</span>
              <span className="text-xs font-normal opacity-80">{tc(option.subtitle, option.value === "default" ? "Campaign image followed by the order number, without the business logo" : option.value === "campaign" ? "Full-width campaign image" : "Control fields and add codes")}</span>
            </Button>
          ))}
        </div>

        {settings.mode === "campaign" && (
          <div className="flex items-center gap-3 rounded-md border p-3">
            <img
              src={RECEIPT_CAMPAIGN_IMAGE}
              alt={tc("صورة حملة الدفاع عن الوطن", "Campaign artwork")}
              className="h-28 w-auto rounded-sm border object-contain"
            />
            <p className="text-sm text-muted-foreground">
              {tc(
                "تُطبع الصورة بعرض الورق كاملًا مع الحفاظ على أبعادها، ثم يظهر رقم الطلب مباشرةً تحتها.",
                "The image prints at the full paper width without distortion, followed immediately by the order number.",
              )}
            </p>
          </div>
        )}

        {settings.mode === "custom" && (
          <>
            <div className="flex items-center justify-between gap-4 rounded-md border p-3">
              <div>
                <Label htmlFor="receipt-campaign-image">{tc("إظهار صورة الحملة أعلى الفاتورة", "Show campaign image at the top")}</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tc("رقم الطلب يظهر تحت الصورة مباشرةً.", "The order number appears directly below the image.")}
                </p>
              </div>
              <Switch
                id="receipt-campaign-image"
                checked={settings.showCampaignImage}
                onCheckedChange={(showCampaignImage) => commit({ ...settings, showCampaignImage })}
              />
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">{tc("العناصر القابلة للإخفاء", "Optional fields")}</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {visibilityOptions.map(([key, labelAr, labelEn]) => (
                  <div key={key} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                    <Label htmlFor={`receipt-visibility-${key}`} className="cursor-pointer text-sm">
                      {tc(labelAr, labelEn)}
                    </Label>
                    <Switch
                      id={`receipt-visibility-${key}`}
                      checked={settings.visibility[key]}
                      onCheckedChange={(checked) =>
                        commit({ ...settings, visibility: { ...settings.visibility, [key]: checked } })
                      }
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {tc(
                  "الأصناف والأسعار والإجمالي والضريبة ورمز ZATCA تبقى ظاهرة في الفاتورة.",
                  "Items, prices, totals, tax details, and the ZATCA QR remain visible on the invoice.",
                )}
              </p>
            </div>

            <div className="space-y-3 border-t pt-4">
              <div>
                <h4 className="text-sm font-semibold">{tc("إضافات الفاتورة", "Receipt additions")}</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tc(
                    "تظهر هذه الإضافات في فاتورة العميل فقط. يمكنك استخدام {{orderNumber}} و{{invoiceNumber}} و{{total}} و{{date}} لقيم خاصة بكل طلب.",
                    "These additions appear on the customer receipt only. Use {{orderNumber}}, {{invoiceNumber}}, {{total}}, or {{date}} for per-order values.",
                  )}
                </p>
              </div>

              {settings.customElements.map((element) => (
                <div key={element.id} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-center">
                  <Switch
                    checked={element.enabled}
                    aria-label={tc("تفعيل الإضافة", "Enable addition")}
                    onCheckedChange={(enabled) => updateElement(element.id, { enabled })}
                  />
                  <Input
                    aria-label={tc("اسم الإضافة", "Addition label")}
                    value={element.label}
                    placeholder={tc("اسم اختياري", "Optional label")}
                    maxLength={80}
                    onChange={(event) => updateElement(element.id, { label: event.target.value })}
                  />
                  <Input
                    aria-label={tc("قيمة الإضافة", "Addition value")}
                    value={element.value}
                    maxLength={240}
                    onChange={(event) => updateElement(element.id, { value: event.target.value })}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={tc("حذف الإضافة", "Remove addition")}
                    onClick={() => commit({ ...settings, customElements: settings.customElements.filter((item) => item.id !== element.id) })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="text-xs text-muted-foreground sm:col-start-2">
                    {tc(element.kind === "qr" ? "رمز QR" : element.kind === "barcode" ? "باركود" : element.kind === "link" ? "رابط مع QR" : "نص", element.kind)}
                  </div>
                  <Select
                    value={element.placement}
                    onValueChange={(placement: ReceiptCustomElement["placement"]) => updateElement(element.id, { placement })}
                  >
                    <SelectTrigger className="h-9 sm:col-start-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="afterOrderInfo">{tc("بعد بيانات الطلب", "After order details")}</SelectItem>
                      <SelectItem value="footer">{tc("آخر الفاتورة", "At the bottom")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}

              <div className="grid gap-2 rounded-md bg-muted/40 p-3 sm:grid-cols-2">
                <Select value={draftKind} onValueChange={(value: ReceiptCustomElementKind) => setDraftKind(value)}>
                  <SelectTrigger aria-label={tc("نوع الإضافة", "Addition type")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qr">{tc("رمز QR", "QR code")}</SelectItem>
                    <SelectItem value="barcode">{tc("باركود", "Barcode")}</SelectItem>
                    <SelectItem value="link">{tc("رابط مع QR", "Link with QR")}</SelectItem>
                    <SelectItem value="text">{tc("نص", "Text")}</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={draftLabel}
                  maxLength={80}
                  placeholder={tc("اسم الإضافة (اختياري)", "Label (optional)")}
                  onChange={(event) => setDraftLabel(event.target.value)}
                />
                <Input
                  value={draftValue}
                  maxLength={240}
                  placeholder={tc("القيمة أو الرابط أو {{orderNumber}}", "Value, URL, or {{orderNumber}}")}
                  onChange={(event) => setDraftValue(event.target.value)}
                  className="sm:col-span-2"
                />
                <Select value={draftPlacement} onValueChange={(value: ReceiptCustomElement["placement"]) => setDraftPlacement(value)}>
                  <SelectTrigger aria-label={tc("مكان الإضافة", "Addition placement")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="afterOrderInfo">{tc("بعد بيانات الطلب", "After order details")}</SelectItem>
                    <SelectItem value="footer">{tc("آخر الفاتورة", "At the bottom")}</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addElement} disabled={!draftValue.trim() || settings.customElements.length >= 8}>
                  <Plus className="ml-2 h-4 w-4" />
                  {tc("إضافة", "Add")}
                </Button>
              </div>
              {settings.customElements.length >= 8 && (
                <p className="text-xs text-muted-foreground">{tc("وصلت للحد الأقصى: 8 إضافات.", "Maximum of 8 additions reached.")}</p>
              )}
            </div>
          </>
        )}

        <details className="rounded-md border">
          <summary className="cursor-pointer px-3 py-2 text-sm font-semibold">
            {tc("معاينة شكل الطباعة", "Print preview")}
          </summary>
          <div className="border-t bg-muted/30 p-2">
            {previewError ? (
              <p className="p-4 text-sm text-destructive">{tc("تعذرت معاينة الفاتورة.", "Could not load the receipt preview.")}</p>
            ) : previewHtml ? (
              <iframe
                title={tc("معاينة فاتورة العميل", "Customer receipt preview")}
                srcDoc={previewHtml}
                sandbox="allow-same-origin"
                className="h-[520px] w-full rounded border bg-white"
              />
            ) : (
              <p className="p-4 text-sm text-muted-foreground">{tc("جارٍ تجهيز المعاينة...", "Preparing preview...")}</p>
            )}
          </div>
        </details>

        </fieldset>
        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
            {loadError
              ? tc("تعذر تحميل الإعدادات المشتركة. المعروض هو آخر شكل محفوظ على هذا الجهاز.", "Could not load shared settings. Showing the last layout saved on this device.")
              : saveState === "saved"
                ? tc("تم حفظ شكل الفاتورة وتطبيقه على جميع الأجهزة.", "Invoice layout saved and applied to all devices.")
                : saveState === "error"
                  ? tc("لم يتم الحفظ على الخادم. تحقق من الاتصال ثم حاول مرة أخرى.", "Could not save to the server. Check the connection and try again.")
                  : tc("التعديلات لا تُطبق على الأجهزة الأخرى إلا بعد الضغط على حفظ.", "Changes apply to other devices only after you save.")}
          </p>
          <Button type="button" onClick={handleSave} disabled={isLoading || isSaving} className="shrink-0">
            <Save className="ml-2 h-4 w-4" />
            {isSaving
              ? tc("جارٍ الحفظ...", "Saving...")
              : tc("حفظ لجميع الأجهزة", "Save for all devices")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {tc("هذا الإعداد يخص فاتورة العميل فقط ولا يغيّر إيصال المطبخ. إعداد واقتران الطابعة يبقيان خاصين بكل جهاز.", "This setting applies to customer receipts, not kitchen tickets. Printer setup and pairing stay on each device.")}
        </p>
      </CardContent>
    </Card>
  );
}
