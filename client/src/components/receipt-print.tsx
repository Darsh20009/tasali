import { forwardRef } from "react";
import tasaliLogo from "@assets/receipt-logo.png";
import { brand } from "@/lib/brand";
import SarIcon from "@/components/sar-icon";
import { VAT_RATE } from "@/lib/constants";

interface OrderItem {
  coffeeItem: {
    nameAr: string;
    nameEn?: string;
    price: string;
  };
  quantity: number;
  itemDiscount?: number;
}

interface ReceiptProps {
  orderNumber: string;
  invoiceNumber?: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: string;
  discount?: {
    code: string;
    percentage: number;
    amount: string;
  };
  invoiceDiscount?: number | string;
  total: string;
  paymentMethod: string;
  employeeName: string;
  tableNumber?: string;
  date: string;
  branchName?: string;
  branchAddress?: string;
  isKitchenCopy?: boolean;
}

const COMPANY_NAME = brand.shortNameAr;
const COMPANY_NAME_EN = brand.nameEn;
const DEFAULT_BRANCH = "الفرع الرئيسي - الرياض";
const DEFAULT_ADDRESS = "الرياض، المملكة العربية السعودية";

function formatDate(dateStr: string): { date: string; time: string } {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return { date: dateStr, time: '' };
    }
    return {
      date: d.toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      time: d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    };
  } catch {
    return { date: dateStr, time: '' };
  }
}

function parseNumber(value: number | string | undefined): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

export const ReceiptPrint = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ orderNumber, invoiceNumber, customerName, customerPhone, items, subtotal, discount, invoiceDiscount, total, paymentMethod, employeeName, tableNumber, date, branchName, branchAddress, isKitchenCopy }, ref) => {
    const displayOrderNumber = orderNumber;
    const totalAmount = parseNumber(total);

    const codeDiscountAmount = discount ? parseNumber(discount.amount) : 0;
    const invDiscountAmount = parseNumber(invoiceDiscount);
    const itemDiscountsTotal = items.reduce((sum, item) => sum + parseNumber(item.itemDiscount), 0);
    const totalDiscounts = codeDiscountAmount + invDiscountAmount + itemDiscountsTotal;

    const subtotalBeforeTax = totalAmount / (1 + VAT_RATE);
    const vatAmount = totalAmount - subtotalBeforeTax;

    const subtotalBeforeAllDiscounts = subtotalBeforeTax + (totalDiscounts / (1 + VAT_RATE));

    const { date: formattedDate, time: formattedTime } = formatDate(date);
    const displayBranchName = branchName || DEFAULT_BRANCH;
    const displayBranchAddress = branchAddress || DEFAULT_ADDRESS;
    const displayInvoiceNumber = invoiceNumber || `INV-${orderNumber}`;

    if (isKitchenCopy) {
      return (
        <div ref={ref} className="hidden print:block">
          <div className="max-w-[80mm] mx-auto bg-white text-black p-4 border-2 border-black" dir="rtl">
            <div className="text-center mb-4 border-b-4 border-double border-black pb-2">
              <h1 className="text-2xl font-bold">بون تحضير</h1>
              <p className="text-xl font-bold mt-1">رقم الطلب: {displayOrderNumber}</p>
            </div>
            <div className="text-lg space-y-1 mb-4 font-bold">
              <div className="flex justify-between">
                <span>التاريخ:</span>
                <span>{formattedDate}</span>
              </div>
              {tableNumber && (
                <div className="flex justify-between">
                  <span>الطاولة:</span>
                  <span>{tableNumber}</span>
                </div>
              )}
            </div>
            <div className="border-b-2 border-black mb-3 pb-2">
              <table className="w-full text-lg">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="text-right py-1">الصنف</th>
                    <th className="text-center py-1">الكمية</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-300">
                      <td className="text-right py-2">
                        <div className="font-bold">{item.coffeeItem.nameAr}</div>
                        {item.coffeeItem.nameEn && (
                          <div className="text-[10px] text-gray-500 font-normal">{item.coffeeItem.nameEn}</div>
                        )}
                      </td>
                      <td className="text-center py-2 text-2xl font-black">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-center text-sm font-bold mt-4">
              <p>نسخة المطبخ / التحضير</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className="hidden print:block">
        <div className="max-w-[80mm] mx-auto bg-white text-black p-3 font-sans" dir="rtl">
          <div className="text-center mb-4 pb-4 border-b-2 border-dashed border-gray-800">
            <img
              src={tasaliLogo}
              alt="تسالي كرومش"
              style={{ width: '110px', height: '110px', objectFit: 'contain', margin: '0 auto 8px', display: 'block' }}
            />
            <h1 className="text-2xl font-bold text-gray-900">{COMPANY_NAME}</h1>
            <p className="text-sm text-gray-600 font-medium">{COMPANY_NAME_EN}</p>
            <p className="text-xs text-gray-500 mt-1">{displayBranchName}</p>
            <p className="text-xs text-gray-400">{displayBranchAddress}</p>
            <p className="text-xs font-bold text-amber-700 mt-1">www.tasaliqurmash.com.sa</p>
            <div className="mt-3 pt-3 border-t border-gray-300">
              <p className="text-lg font-bold text-gray-900">فاتورة ضريبية مبسطة</p>
              <p className="text-xs text-gray-500">Simplified Tax Invoice</p>
            </div>
          </div>

          <div className="mb-4 pb-3 border-b border-dashed border-gray-400">
            <div className="bg-amber-50 rounded-lg p-2 mb-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">رقم الفاتورة:</span>
                <span className="font-bold text-amber-800">{displayInvoiceNumber}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">التاريخ:</span>
                <span className="font-medium">{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">الوقت:</span>
                <span className="font-medium" dir="ltr">{formattedTime}</span>
              </div>
            </div>
          </div>

          <div className="mb-4 pb-3 border-b border-dashed border-gray-400 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between">
                <span className="text-gray-600">العميل:</span>
                <span className="font-medium">{customerName || 'عميل'}</span>
              </div>
              {customerPhone && (
                <div className="flex justify-between">
                  <span className="text-gray-600">الجوال:</span>
                  <span className="font-mono" dir="ltr">{customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">الكاشير:</span>
                <span className="font-medium">{employeeName}</span>
              </div>
              {tableNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">الطاولة:</span>
                  <span className="font-medium">{tableNumber}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-gray-800">
                  <th className="text-right py-2 font-bold">الصنف</th>
                  <th className="text-center py-2 font-bold w-12">الكمية</th>
                  <th className="text-center py-2 font-bold w-16">السعر</th>
                  <th className="text-left py-2 font-bold w-16">المجموع</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const unitPrice = parseNumber(item.coffeeItem.price);
                  const lineTotal = unitPrice * item.quantity;
                  const itemDiscount = parseNumber(item.itemDiscount);
                  const lineAfterDiscount = lineTotal - itemDiscount;
                  return (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-2">
                        <div className="font-medium text-gray-900">{item.coffeeItem.nameAr}</div>
                        {item.coffeeItem.nameEn && (
                          <div className="text-[10px] text-gray-500">{item.coffeeItem.nameEn}</div>
                        )}
                        {itemDiscount > 0 && (
                          <div className="text-[10px] text-green-600">خصم: {itemDiscount.toFixed(2)}-</div>
                        )}
                      </td>
                      <td className="text-center py-2">{item.quantity}</td>
                      <td className="text-center py-2">{unitPrice.toFixed(2)}</td>
                      <td className="text-left py-2 font-medium">{lineAfterDiscount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mb-4 pb-3 border-b border-dashed border-gray-400">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">المجموع قبل الضريبة والخصم:</span>
                <span>{subtotalBeforeAllDiscounts.toFixed(2)} <SarIcon /></span>
              </div>
              
              {itemDiscountsTotal > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>خصومات الأصناف:</span>
                  <span>({(itemDiscountsTotal / (1 + VAT_RATE)).toFixed(2)}) <SarIcon /></span>
                </div>
              )}
              
              {discount && codeDiscountAmount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>خصم {discount.code} ({discount.percentage}%):</span>
                  <span>({(codeDiscountAmount / (1 + VAT_RATE)).toFixed(2)}) <SarIcon /></span>
                </div>
              )}

              {invDiscountAmount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>خصم الفاتورة:</span>
                  <span>({(invDiscountAmount / (1 + VAT_RATE)).toFixed(2)}) <SarIcon /></span>
                </div>
              )}

              <div className="flex justify-between pt-1 border-t border-gray-200">
                <span className="text-gray-600">الصافي قبل الضريبة:</span>
                <span>{subtotalBeforeTax.toFixed(2)} <SarIcon /></span>
              </div>

              <div className="flex justify-between font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                <span>ضريبة القيمة المضافة (15%):</span>
                <span>{vatAmount.toFixed(2)} <SarIcon /></span>
              </div>

              <div className="flex justify-between font-bold text-lg text-gray-900 bg-amber-100 px-2 py-2 rounded mt-2">
                <span>الإجمالي شامل الضريبة:</span>
                <span>{totalAmount.toFixed(2)} <SarIcon /></span>
              </div>
            </div>
          </div>

          <div className="mb-4 pb-3 border-b border-dashed border-gray-400">
            <div className="flex justify-between items-center bg-blue-50 px-3 py-2 rounded text-sm">
              <span className="text-gray-600">طريقة الدفع:</span>
              <span className="font-bold text-blue-800">{paymentMethod}</span>
            </div>
          </div>

          <div className="mb-4 pt-4 border-t-2 border-dashed border-gray-800 text-center">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-bold text-gray-600 mb-1">ملخص الطلب السريع</p>
              <p className="text-3xl font-black text-gray-900 mb-2">
                #{displayOrderNumber}
              </p>
              <div className="text-right space-y-1">
                {items.map((item, idx) => (
                  <div key={idx} className="text-[11px] text-gray-800">
                    <span className="font-bold">{item.quantity} x {item.coffeeItem.nameAr}</span>
                    {item.coffeeItem.nameEn && (
                      <span className="text-[10px] text-gray-500 mr-1">/ {item.coffeeItem.nameEn}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center pt-4 border-t-2 border-gray-800">
            <p className="text-sm font-bold text-gray-900 mb-1">شكراً لزيارتكم</p>
            <p className="text-xs text-gray-600 mb-3">Thank you for visiting us</p>
            <div className="bg-gray-100 rounded-lg p-2 mb-3 text-xs">
              <p className="text-gray-600">جميع الأسعار شاملة ضريبة القيمة المضافة 15%</p>
              <p className="text-gray-500">All prices include 15% VAT</p>
              <p className="font-bold text-amber-700 mt-1">{brand.website}</p>
            </div>
            <div className="text-xs text-gray-500">
              <p>تابعونا على وسائل التواصل الاجتماعي</p>
              <p className="font-mono font-bold text-amber-700">{brand.social.instagram}</p>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-300 text-[9px] text-gray-400">
              <p>تم إنشاء هذه الفاتورة إلكترونياً</p>
              <p>This invoice was generated electronically</p>
            </div>
          </div>
        </div>

        <style>{`
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print\\:block {
              display: block !important;
            }
            .hidden {
              display: none !important;
            }
          }
        `}</style>
      </div>
    );
  }
);

ReceiptPrint.displayName = "ReceiptPrint";
