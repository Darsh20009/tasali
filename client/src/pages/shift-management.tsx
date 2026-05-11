import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Play, Square, Clock, DollarSign, CreditCard, TrendingUp,
  ArrowUpCircle, ArrowDownCircle, FileText, Printer, Calendar,
  User, ShoppingCart, Receipt, AlertTriangle, CheckCircle,
  History, Banknote, Zap, ChevronDown, ChevronUp, RefreshCw,
} from "lucide-react";

interface CashierShift {
  _id: string;
  shiftNumber: string;
  employeeId?: string;
  employeeName: string;
  branchId?: string;
  branchName?: string;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  closingCash?: number;
  expectedCash?: number;
  cashDifference?: number;
  totalSales: number;
  totalOrders: number;
  totalCashSales: number;
  totalCardSales: number;
  totalDigitalSales: number;
  totalRefunds: number;
  totalDiscounts: number;
  totalCancelledOrders: number;
  totalVAT: number;
  netRevenue: number;
  paymentBreakdown: Record<string, number>;
  orderTypeBreakdown: Record<string, number>;
  cashMovements: Array<{ type: string; amount: number; reason: string; timestamp: string; performedBy?: string }>;
  orderIds: string[];
  notes?: string;
  closingNotes?: string;
  isAuto?: boolean;
  type?: 'auto' | 'manual';
}

const fmt = (n: number) => `${(n || 0).toFixed(2)} ر.س`;

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(start: string, end?: string) {
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const mins = Math.floor((e - s) / 60000);
  const hrs = Math.floor(mins / 60);
  const m = mins % 60;
  return `${hrs}:${m.toString().padStart(2, '0')} ساعة`;
}

export default function ShiftManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showCashMovementDialog, setShowCashMovementDialog] = useState(false);
  const [showZReportDialog, setShowZReportDialog] = useState(false);
  const [openingCash, setOpeningCash] = useState("");
  const [openingNotes, setOpeningNotes] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [movementType, setMovementType] = useState<string>("cash_in");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementReason, setMovementReason] = useState("");
  const [selectedShift, setSelectedShift] = useState<CashierShift | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'auto'>('current');
  const [expandedAutoId, setExpandedAutoId] = useState<string | null>(null);

  const { data: activeShift, isLoading: loadingShift, refetch: refetchActive } = useQuery<CashierShift | null>({
    queryKey: ['/api/shifts/active'],
    refetchInterval: 30000,
  });

  const { data: shiftHistory = [] } = useQuery<CashierShift[]>({
    queryKey: ['/api/shifts/history'],
    enabled: activeTab === 'history',
  });

  const { data: autoShifts = [], isLoading: loadingAuto, refetch: refetchAuto } = useQuery<CashierShift[]>({
    queryKey: ['/api/shifts/auto'],
    enabled: activeTab === 'auto',
    refetchInterval: false,
  });

  const openShiftMutation = useMutation({
    mutationFn: async (data: { openingCash: number; notes: string }) => {
      const res = await apiRequest("POST", "/api/shifts/open", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "تم فتح الوردية بنجاح", description: "يمكنك الآن استقبال الطلبات" });
      queryClient.invalidateQueries({ queryKey: ['/api/shifts/active'] });
      setShowOpenDialog(false);
      setOpeningCash(""); setOpeningNotes("");
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message || "فشل في فتح الوردية", variant: "destructive" });
    },
  });

  const closeShiftMutation = useMutation({
    mutationFn: async (data: { closingCash: number; closingNotes: string }) => {
      const res = await apiRequest("POST", "/api/shifts/close", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "تم إغلاق الوردية", description: "تم إنشاء التقرير بنجاح" });
      queryClient.invalidateQueries({ queryKey: ['/api/shifts/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shifts/history'] });
      setShowCloseDialog(false);
      setClosingCash(""); setClosingNotes("");
      if (data.shift) { setSelectedShift(data.shift); setShowZReportDialog(true); }
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message || "فشل في إغلاق الوردية", variant: "destructive" });
    },
  });

  const cashMovementMutation = useMutation({
    mutationFn: async (data: { type: string; amount: number; reason: string }) => {
      const res = await apiRequest("POST", "/api/shifts/cash-movement", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "تم تسجيل الحركة بنجاح" });
      queryClient.invalidateQueries({ queryKey: ['/api/shifts/active'] });
      setShowCashMovementDialog(false);
      setMovementAmount(""); setMovementReason("");
    },
    onError: (error: any) => {
      toast({ title: "خطأ", description: error.message || "فشل في تسجيل الحركة", variant: "destructive" });
    },
  });

  const handlePrintShift = useCallback((shift: CashierShift) => {
    const printWindow = window.open('', '_blank', 'width=400,height=800');
    if (!printWindow) return;
    const pb = shift.paymentBreakdown || {};
    const cashIn = (shift.cashMovements || []).filter(m => m.type === 'cash_in' || m.type === 'paid_in').reduce((s, m) => s + m.amount, 0);
    const cashOut = (shift.cashMovements || []).filter(m => m.type === 'cash_out' || m.type === 'paid_out').reduce((s, m) => s + m.amount, 0);

    printWindow.document.write(`<html dir="rtl"><head><title>تقرير الوردية</title>
      <style>
        body{font-family:Arial,sans-serif;padding:12px;max-width:340px;margin:0 auto;font-size:13px}
        .hdr{text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:8px}
        .hdr h1{font-size:18px;margin:4px 0}.hdr h2{font-size:13px;color:#7D3D0F;margin:2px 0}
        .row{display:flex;justify-content:space-between;padding:2px 0}
        .sec{border-top:1px dashed #999;margin:8px 0;padding-top:8px}
        .sec-t{font-weight:bold;font-size:13px;margin-bottom:5px;color:#7D3D0F}
        .bold{font-weight:bold;font-size:14px;border-top:2px solid #000;padding-top:4px;margin-top:4px}
        .pos{color:#16a34a}.neg{color:#dc2626}
        .foot{text-align:center;margin-top:12px;border-top:1px dashed #999;padding-top:8px;font-size:11px;color:#666}
        @media print{body{padding:4px}}
      </style></head><body>
      <div class="hdr">
        <h1>تسالي كرومش</h1>
        <h2>${shift.isAuto ? 'وردية تلقائية' : 'تقرير Z — إغلاق الوردية'}</h2>
        <div style="font-size:11px;color:#666">${shift.shiftNumber}</div>
      </div>
      <div class="row"><span>الكاشير:</span><span>${shift.employeeName}</span></div>
      ${shift.branchName ? `<div class="row"><span>الفرع:</span><span>${shift.branchName}</span></div>` : ''}
      <div class="row"><span>بداية الوردية:</span><span>${fmtTime(shift.openedAt)}</span></div>
      <div class="row"><span>نهاية الوردية:</span><span>${shift.closedAt ? fmtTime(shift.closedAt) : 'مفتوحة'}</span></div>
      <div class="row"><span>المدة:</span><span>${fmtDuration(shift.openedAt, shift.closedAt)}</span></div>

      <div class="sec">
        <div class="sec-t">ملخص المبيعات</div>
        <div class="row"><span>إجمالي المبيعات:</span><span>${fmt(shift.totalSales)}</span></div>
        <div class="row"><span>عدد الطلبات:</span><span>${shift.totalOrders}</span></div>
        <div class="row"><span>ضريبة القيمة المضافة:</span><span>${fmt(shift.totalVAT)}</span></div>
        <div class="row"><span>الخصومات:</span><span>${fmt(shift.totalDiscounts)}</span></div>
        <div class="row"><span>المرتجعات:</span><span>${fmt(shift.totalRefunds)}</span></div>
        <div class="bold row"><span>صافي الإيرادات:</span><span>${fmt(shift.netRevenue)}</span></div>
      </div>

      <div class="sec">
        <div class="sec-t">طرق الدفع</div>
        <div class="row"><span>نقدي:</span><span>${fmt(pb.cash || 0)}</span></div>
        <div class="row"><span>شبكة:</span><span>${fmt(pb.card || 0)}</span></div>
        ${(pb.loyalty || 0) > 0 ? `<div class="row"><span>بطاقة ولاء:</span><span>${fmt(pb.loyalty)}</span></div>` : ''}
      </div>

      ${!shift.isAuto && shift.status === 'closed' ? `
      <div class="sec">
        <div class="sec-t">تسوية الصندوق</div>
        <div class="row"><span>رصيد الافتتاح:</span><span>${fmt(shift.openingCash)}</span></div>
        ${cashIn > 0 ? `<div class="row"><span>إيداعات نقدية:</span><span>${fmt(cashIn)}</span></div>` : ''}
        ${cashOut > 0 ? `<div class="row"><span>سحوبات نقدية:</span><span>${fmt(cashOut)}</span></div>` : ''}
        <div class="row"><span>المبيعات النقدية:</span><span>${fmt(shift.totalCashSales)}</span></div>
        <div class="row"><span>الرصيد المتوقع:</span><span>${fmt(shift.expectedCash || 0)}</span></div>
        <div class="row"><span>الرصيد الفعلي:</span><span>${fmt(shift.closingCash || 0)}</span></div>
        <div class="bold row">
          <span>الفرق:</span>
          <span class="${(shift.cashDifference || 0) >= 0 ? 'pos' : 'neg'}">${(shift.cashDifference || 0) >= 0 ? '+' : ''}${fmt(shift.cashDifference || 0)}</span>
        </div>
      </div>` : ''}

      ${shift.closingNotes ? `<div class="sec"><div class="sec-t">ملاحظات</div><p>${shift.closingNotes}</p></div>` : ''}

      <div class="foot">
        <div>TASALI QURUMSH SYSTEMS</div>
        <div>${new Date().toLocaleString('ar-SA')}</div>
      </div>
    </body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }, []);

  if (loadingShift) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary" />
          إدارة الورديات
        </h1>
        <div className="flex gap-2 flex-wrap">
          {(['current', 'auto', 'history'] as const).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab)}
              className="gap-1"
            >
              {tab === 'current' ? <><Clock className="w-4 h-4" /> الوردية الحالية</> :
               tab === 'auto' ? <><Zap className="w-4 h-4" /> التلقائية</> :
               <><History className="w-4 h-4" /> السجل</>}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Current Tab ── */}
      {activeTab === 'current' && (
        <>
          {!activeShift ? (
            <Card className="border-2 border-dashed border-primary/30">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Play className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">لا توجد وردية مفتوحة</h2>
                <p className="text-muted-foreground text-center mb-6">افتح وردية لبدء تتبع المبيعات</p>
                <Button size="lg" onClick={() => setShowOpenDialog(true)} className="gap-2">
                  <Play className="w-5 h-5" /> فتح وردية جديدة
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Status Bar */}
              <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-emerald-500 text-white animate-pulse">مفتوحة</Badge>
                      <span className="font-mono text-sm">{activeShift.shiftNumber}</span>
                      <span className="text-sm text-muted-foreground">|</span>
                      <span className="text-sm flex items-center gap-1"><User className="w-3.5 h-3.5" />{activeShift.employeeName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {fmtTime(activeShift.openedAt)} — {fmtDuration(activeShift.openedAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: DollarSign, label: 'إجمالي المبيعات', value: fmt(activeShift.totalSales), color: 'text-primary' },
                  { icon: ShoppingCart, label: 'عدد الطلبات', value: String(activeShift.totalOrders), color: 'text-blue-500' },
                  { icon: Banknote, label: 'مبيعات نقدية', value: fmt(activeShift.totalCashSales), color: 'text-green-600' },
                  { icon: CreditCard, label: 'مبيعات شبكة', value: fmt(activeShift.totalCardSales + (activeShift.totalDigitalSales || 0)), color: 'text-purple-500' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <Card key={label}>
                    <CardContent className="py-4 px-3 text-center">
                      <Icon className={`w-6 h-6 mx-auto mb-1 ${color}`} />
                      <div className="text-xl font-bold font-mono">{value}</div>
                      <div className="text-xs text-muted-foreground">{label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Payment breakdown + extra */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm flex items-center gap-2"><CreditCard className="w-4 h-4" /> طرق الدفع</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    {Object.entries(activeShift.paymentBreakdown || {}).map(([key, value]) => {
                      if (!value || value === 0) return null;
                      const labels: Record<string, string> = { cash: 'نقدي', card: 'شبكة', loyalty: 'بطاقة تسالي' };
                      return (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-sm">{labels[key] || key}</span>
                          <span className="font-mono text-sm font-medium">{fmt(value)}</span>
                        </div>
                      );
                    })}
                    {Object.values(activeShift.paymentBreakdown || {}).every(v => !v) && (
                      <p className="text-sm text-muted-foreground text-center py-2">لا توجد مبيعات بعد</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm flex items-center gap-2"><Receipt className="w-4 h-4" /> تفاصيل إضافية</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span>ضريبة القيمة المضافة</span><span className="font-mono">{fmt(activeShift.totalVAT)}</span></div>
                    <div className="flex justify-between"><span>الخصومات</span><span className="font-mono">{fmt(activeShift.totalDiscounts)}</span></div>
                    <div className="flex justify-between"><span>المرتجعات</span><span className="font-mono">{fmt(activeShift.totalRefunds)}</span></div>
                    <div className="flex justify-between"><span>الطلبات الملغاة</span><span className="font-mono">{activeShift.totalCancelledOrders}</span></div>
                    <div className="flex justify-between font-bold border-t pt-2"><span>صافي الإيرادات</span><span className="font-mono text-primary">{fmt(activeShift.netRevenue)}</span></div>
                  </CardContent>
                </Card>
              </div>

              {/* Cash movements */}
              {(activeShift.cashMovements || []).length > 0 && (
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm flex items-center gap-2"><ArrowUpCircle className="w-4 h-4" /> حركات الصندوق</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    {activeShift.cashMovements.map((m, i) => (
                      <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          {(m.type === 'cash_in' || m.type === 'paid_in') ? <ArrowUpCircle className="w-4 h-4 text-green-500" /> : <ArrowDownCircle className="w-4 h-4 text-red-500" />}
                          <div>
                            <div className="text-sm font-medium">{m.type === 'cash_in' ? 'إيداع' : m.type === 'cash_out' ? 'سحب' : m.type === 'paid_in' ? 'دفع وارد' : 'دفع صادر'}</div>
                            <div className="text-xs text-muted-foreground">{m.reason}</div>
                          </div>
                        </div>
                        <div className="text-left">
                          <div className={`font-mono text-sm font-medium ${(m.type === 'cash_in' || m.type === 'paid_in') ? 'text-green-600' : 'text-red-600'}`}>
                            {(m.type === 'cash_in' || m.type === 'paid_in') ? '+' : '-'}{fmt(m.amount)}
                          </div>
                          <div className="text-xs text-muted-foreground">{fmtTime(m.timestamp)}</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="grid grid-cols-3 gap-3">
                <Button variant="outline" className="h-12 gap-2" onClick={() => setShowCashMovementDialog(true)}>
                  <ArrowUpCircle className="w-4 h-4" /> حركة نقدية
                </Button>
                <Button variant="outline" className="h-12 gap-2" onClick={() => handlePrintShift(activeShift)}>
                  <Printer className="w-4 h-4" /> طباعة الوردية
                </Button>
                <Button variant="destructive" className="h-12 gap-2" onClick={() => setShowCloseDialog(true)}>
                  <Square className="w-4 h-4" /> إغلاق الوردية
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {/* ── Auto Shifts Tab ── */}
      {activeTab === 'auto' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              الورديات التلقائية تُحسب بناءً على الطلبات في كل فترة زمنية
            </p>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => refetchAuto()}>
              <RefreshCw className="w-3.5 h-3.5" /> تحديث
            </Button>
          </div>

          {loadingAuto ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : autoShifts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <Zap className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">لا توجد ورديات تلقائية سابقة</p>
                <p className="text-xs text-muted-foreground mt-1">ستظهر هنا فور وجود طلبات مكتملة</p>
              </CardContent>
            </Card>
          ) : (
            autoShifts.map((shift) => (
              <Card key={shift._id} className="cursor-pointer hover:border-primary/30 transition-colors">
                <CardContent className="py-3 px-4">
                  <div
                    className="flex items-center justify-between"
                    onClick={() => setExpandedAutoId(expandedAutoId === shift._id ? null : shift._id)}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                        <Zap className="w-3 h-3 ml-1" /> تلقائية
                      </Badge>
                      <span className="font-mono text-xs">{shift.shiftNumber}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{fmtDate(shift.openedAt)}</span>
                      {expandedAutoId === shift._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm mt-2">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{fmtTime(shift.openedAt)} — {shift.closedAt ? fmtTime(shift.closedAt) : '-'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-primary font-mono">{fmt(shift.totalSales)}</span>
                      <span className="text-muted-foreground">{shift.totalOrders} طلب</span>
                    </div>
                  </div>

                  {expandedAutoId === shift._id && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-muted/50 rounded p-2 text-center">
                          <div className="font-mono font-bold text-green-700">{fmt(shift.totalCashSales)}</div>
                          <div className="text-muted-foreground">نقدي</div>
                        </div>
                        <div className="bg-muted/50 rounded p-2 text-center">
                          <div className="font-mono font-bold text-blue-700">{fmt(shift.totalCardSales)}</div>
                          <div className="text-muted-foreground">شبكة</div>
                        </div>
                        <div className="bg-muted/50 rounded p-2 text-center">
                          <div className="font-mono font-bold text-amber-700">{fmt(shift.totalVAT)}</div>
                          <div className="text-muted-foreground">ضريبة</div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => handlePrintShift(shift)}
                      >
                        <Printer className="w-4 h-4" /> طباعة تقرير هذه الفترة
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ── History Tab ── */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {shiftHistory.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <History className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">لا يوجد سجل ورديات يدوية</p>
              </CardContent>
            </Card>
          ) : (
            shiftHistory.map((shift) => (
              <Card
                key={shift._id}
                className="cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => { setSelectedShift(shift); setShowZReportDialog(true); }}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={shift.status === 'open' ? 'default' : 'secondary'}>
                        {shift.status === 'open' ? 'مفتوحة' : 'مغلقة'}
                      </Badge>
                      <span className="font-mono text-xs">{shift.shiftNumber}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{fmtDate(shift.openedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{shift.employeeName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-primary font-mono">{fmt(shift.totalSales)}</span>
                      <span className="text-muted-foreground">{shift.totalOrders} طلب</span>
                    </div>
                  </div>
                  {shift.status === 'closed' && shift.cashDifference !== undefined && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs">
                      <span>فرق الصندوق</span>
                      <span className={shift.cashDifference >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {shift.cashDifference >= 0 ? '+' : ''}{fmt(shift.cashDifference)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ── Open Shift Dialog ── */}
      <Dialog open={showOpenDialog} onOpenChange={setShowOpenDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Play className="w-5 h-5 text-primary" /> فتح وردية جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">رصيد الافتتاح (ر.س)</label>
              <Input type="number" placeholder="0.00" value={openingCash} onChange={e => setOpeningCash(e.target.value)} className="text-lg text-center font-mono" dir="ltr" />
              <p className="text-xs text-muted-foreground mt-1">أدخل المبلغ الموجود في الصندوق عند بدء الوردية</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">ملاحظات (اختياري)</label>
              <Textarea placeholder="أي ملاحظات..." value={openingNotes} onChange={e => setOpeningNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOpenDialog(false)}>إلغاء</Button>
            <Button onClick={() => openShiftMutation.mutate({ openingCash: Number(openingCash) || 0, notes: openingNotes })} disabled={openShiftMutation.isPending} className="gap-2">
              {openShiftMutation.isPending ? "جاري الفتح..." : "فتح الوردية"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Close Shift Dialog ── */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Square className="w-5 h-5 text-red-500" /> إغلاق الوردية</DialogTitle>
          </DialogHeader>
          {activeShift && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>رصيد الافتتاح</span><span className="font-mono">{fmt(activeShift.openingCash)}</span></div>
              <div className="flex justify-between"><span>المبيعات النقدية</span><span className="font-mono">{fmt(activeShift.totalCashSales)}</span></div>
              <div className="flex justify-between font-bold border-t pt-1"><span>إجمالي المبيعات</span><span className="font-mono text-primary">{fmt(activeShift.totalSales)}</span></div>
            </div>
          )}
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">الرصيد الفعلي في الصندوق (ر.س)</label>
              <Input type="number" placeholder="0.00" value={closingCash} onChange={e => setClosingCash(e.target.value)} className="text-lg text-center font-mono" dir="ltr" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">ملاحظات الإغلاق (اختياري)</label>
              <Textarea placeholder="أي ملاحظات..." value={closingNotes} onChange={e => setClosingNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => closeShiftMutation.mutate({ closingCash: Number(closingCash) || 0, closingNotes })} disabled={closeShiftMutation.isPending} className="gap-2">
              {closeShiftMutation.isPending ? "جاري الإغلاق..." : "إغلاق وطباعة التقرير"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cash Movement Dialog ── */}
      <Dialog open={showCashMovementDialog} onOpenChange={setShowCashMovementDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>حركة نقدية</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'cash_in', label: 'إيداع', icon: ArrowUpCircle, color: 'text-green-600' },
                { value: 'cash_out', label: 'سحب', icon: ArrowDownCircle, color: 'text-red-600' },
              ].map(({ value, label, icon: Icon, color }) => (
                <Button key={value} variant={movementType === value ? 'default' : 'outline'} className="h-16 flex-col gap-1" onClick={() => setMovementType(value)}>
                  <Icon className={`w-5 h-5 ${movementType === value ? '' : color}`} />
                  {label}
                </Button>
              ))}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">المبلغ (ر.س)</label>
              <Input type="number" placeholder="0.00" value={movementAmount} onChange={e => setMovementAmount(e.target.value)} className="text-lg text-center font-mono" dir="ltr" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">السبب</label>
              <Textarea placeholder="سبب الحركة النقدية..." value={movementReason} onChange={e => setMovementReason(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCashMovementDialog(false)}>إلغاء</Button>
            <Button onClick={() => cashMovementMutation.mutate({ type: movementType, amount: Number(movementAmount) || 0, reason: movementReason })} disabled={cashMovementMutation.isPending || !movementAmount}>
              {cashMovementMutation.isPending ? "جاري التسجيل..." : "تسجيل"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Z-Report / Shift Detail Dialog ── */}
      <Dialog open={showZReportDialog} onOpenChange={setShowZReportDialog}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {selectedShift?.isAuto ? 'تقرير الوردية التلقائية' : 'تقرير Z'} — {selectedShift?.shiftNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedShift && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span>الكاشير</span><span className="font-medium">{selectedShift.employeeName}</span></div>
                <div className="flex justify-between"><span>بداية الوردية</span><span>{fmtTime(selectedShift.openedAt)}</span></div>
                <div className="flex justify-between"><span>نهاية الوردية</span><span>{selectedShift.closedAt ? fmtTime(selectedShift.closedAt) : 'مفتوحة'}</span></div>
                <div className="flex justify-between"><span>المدة</span><span>{fmtDuration(selectedShift.openedAt, selectedShift.closedAt)}</span></div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-sm flex items-center gap-1"><TrendingUp className="w-4 h-4 text-primary" /> ملخص المبيعات</h3>
                <div className="bg-primary/5 rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span>إجمالي المبيعات</span><span className="font-mono font-bold text-primary">{fmt(selectedShift.totalSales)}</span></div>
                  <div className="flex justify-between"><span>عدد الطلبات</span><span className="font-mono">{selectedShift.totalOrders}</span></div>
                  <div className="flex justify-between"><span>ضريبة القيمة المضافة</span><span className="font-mono">{fmt(selectedShift.totalVAT)}</span></div>
                  <div className="flex justify-between"><span>الخصومات</span><span className="font-mono">{fmt(selectedShift.totalDiscounts)}</span></div>
                  <div className="flex justify-between"><span>المرتجعات</span><span className="font-mono">{fmt(selectedShift.totalRefunds)}</span></div>
                  <div className="flex justify-between font-bold border-t pt-1"><span>صافي الإيرادات</span><span className="font-mono text-primary">{fmt(selectedShift.netRevenue)}</span></div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-sm flex items-center gap-1"><CreditCard className="w-4 h-4" /> طرق الدفع</h3>
                <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span>نقدي</span><span className="font-mono">{fmt((selectedShift.paymentBreakdown?.cash) || 0)}</span></div>
                  <div className="flex justify-between"><span>شبكة</span><span className="font-mono">{fmt((selectedShift.paymentBreakdown?.card) || 0)}</span></div>
                  {((selectedShift.paymentBreakdown?.loyalty) || 0) > 0 && (
                    <div className="flex justify-between"><span>بطاقة تسالي</span><span className="font-mono">{fmt(selectedShift.paymentBreakdown?.loyalty || 0)}</span></div>
                  )}
                </div>
              </div>

              {!selectedShift.isAuto && selectedShift.status === 'closed' && (
                <div className="space-y-2">
                  <h3 className="font-bold text-sm flex items-center gap-1"><Banknote className="w-4 h-4" /> تسوية الصندوق</h3>
                  <div className={`rounded-lg p-3 space-y-1 text-sm ${
                    (selectedShift.cashDifference || 0) === 0 ? 'bg-green-50 dark:bg-green-950/20' :
                    (selectedShift.cashDifference || 0) > 0 ? 'bg-blue-50 dark:bg-blue-950/20' : 'bg-red-50 dark:bg-red-950/20'
                  }`}>
                    <div className="flex justify-between"><span>رصيد الافتتاح</span><span className="font-mono">{fmt(selectedShift.openingCash)}</span></div>
                    <div className="flex justify-between"><span>المبيعات النقدية</span><span className="font-mono">{fmt(selectedShift.totalCashSales)}</span></div>
                    <div className="flex justify-between"><span>الرصيد المتوقع</span><span className="font-mono">{fmt(selectedShift.expectedCash || 0)}</span></div>
                    <div className="flex justify-between"><span>الرصيد الفعلي</span><span className="font-mono">{fmt(selectedShift.closingCash || 0)}</span></div>
                    <div className="flex justify-between font-bold border-t pt-1">
                      <span className="flex items-center gap-1">
                        الفرق
                        {(selectedShift.cashDifference || 0) === 0 ? <CheckCircle className="w-4 h-4 text-green-500" /> :
                         (selectedShift.cashDifference || 0) > 0 ? <TrendingUp className="w-4 h-4 text-blue-500" /> :
                         <AlertTriangle className="w-4 h-4 text-red-500" />}
                      </span>
                      <span className={`font-mono ${
                        (selectedShift.cashDifference || 0) === 0 ? 'text-green-600' :
                        (selectedShift.cashDifference || 0) > 0 ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {(selectedShift.cashDifference || 0) >= 0 ? '+' : ''}{fmt(selectedShift.cashDifference || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Button className="w-full gap-2" onClick={() => handlePrintShift(selectedShift)}>
                <Printer className="w-4 h-4" /> طباعة التقرير
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
