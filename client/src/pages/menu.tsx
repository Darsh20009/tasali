import { useState, useMemo } from "react";
import { useTranslate } from "@/lib/useTranslate";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useCustomer } from "@/contexts/CustomerContext";
import { useLocation } from "wouter";
import { 
  Coffee, 
  Flame, 
  Snowflake, 
  Star, 
  Cake, 
  User, 
  Search, 
  MapPin, 
  Clock, 
  Utensils, 
  Sparkles,
  Languages,
  Phone,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Send,
  CheckCircle,
  X,
  ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import tasaliLogo from "@assets/logo.png";
import type { CoffeeItem, IProductAddon } from "@shared/schema";
import { AddToCartModal } from "@/components/add-to-cart-modal";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { AddonPreview } from "@/components/menu-layouts";
import SarIcon from "@/components/sar-icon";
import { apiRequest } from "@/lib/queryClient";

interface MenuCategory {
  id: string;
  nameAr: string;
  nameEn?: string;
  icon?: string;
  department?: 'drinks' | 'food';
  orderIndex: number;
  isSystem?: boolean;
}

interface CartEntry {
  key: string;
  cartItem: any;
  nameAr: string;
  nameEn?: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

export default function MenuPage() {
  const tc = useTranslate();
  const { isAuthenticated, customer } = useCustomer();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { i18n } = useTranslation();
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<CoffeeItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerNote, setCustomerNote] = useState("");
  const [orderSuccess, setOrderSuccess] = useState<{ orderNumber: string } | null>(null);

  const { data: coffeeItems = [], isLoading } = useQuery<CoffeeItem[]>({
    queryKey: ["/api/coffee-items"],
  });

  const { data: allAddons = [] } = useQuery<IProductAddon[]>({
    queryKey: ["/api/product-addons"],
  });

  const { data: itemsWithAddonsList = [] } = useQuery<string[]>({
    queryKey: ["/api/coffee-items/with-addons"],
    staleTime: 5 * 60 * 1000,
  });
  const itemsWithAddonsSet = useMemo(() => new Set(itemsWithAddonsList), [itemsWithAddonsList]);

  const { data: itemAddonsMap = {} } = useQuery<Record<string, AddonPreview[]>>({
    queryKey: ["/api/coffee-items/addons-preview"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: dynamicCategories = [] } = useQuery<MenuCategory[]>({
    queryKey: ["/api/menu-categories"],
  });

  const { data: businessConfig } = useQuery<any>({
    queryKey: ["/api/business-config"],
  });

  const sendOrderMutation = useMutation({
    mutationFn: async (orderBody: any) => {
      const res = await apiRequest("POST", "/api/orders", orderBody);
      return res.json();
    },
    onSuccess: (data) => {
      setOrderSuccess({ orderNumber: data.orderNumber || data._id?.slice(-6).toUpperCase() || "—" });
      setCart([]);
      setCustomerNote("");
      setIsCartOpen(false);
    },
    onError: () => {
      toast({
        title: tc("خطأ", "Error"),
        description: tc("حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى", "Failed to send order, please try again"),
        variant: "destructive",
      });
    },
  });

  const isStoreOpen = () => {
    if (!businessConfig) return true;
    if (businessConfig.isEmergencyClosed) return false;
    const storeHours = businessConfig.storeHours || {};
    const isAlwaysOpenGlobal = Object.values(storeHours).every((h: any) => h?.isAlwaysOpen || (h?.open === "00:00" && h?.close === "23:59"));
    if (isAlwaysOpenGlobal) return true;
    const now = new Date();
    const riyadhTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Riyadh', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'long'
    }).formatToParts(now);
    const currentDay = riyadhTime.find(p => p.type === 'weekday')?.value.toLowerCase() || 'monday';
    const currentHour = parseInt(riyadhTime.find(p => p.type === 'hour')?.value || '0');
    const currentMinute = parseInt(riyadhTime.find(p => p.type === 'minute')?.value || '0');
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const hours = businessConfig.storeHours?.[currentDay];
    if (!hours || !hours.isOpen) return false;
    if (hours.isAlwaysOpen || (hours.open === '00:00' && hours.close === '23:59')) return true;
    const [openH, openM] = (hours.open || '06:00').split(':').map(Number);
    const [closeH, closeM] = (hours.close || '03:00').split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    let closeMinutes = closeH * 60 + closeM;
    if (closeMinutes <= openMinutes) {
      if (currentTimeInMinutes >= openMinutes || currentTimeInMinutes <= closeMinutes) return true;
    } else {
      if (currentTimeInMinutes >= openMinutes && currentTimeInMinutes <= closeMinutes) return true;
    }
    return false;
  };

  const iconMap: Record<string, any> = { Coffee, Flame, Snowflake, Star, Cake, Utensils, Sparkles };

  const allTab = { id: "all", name: tc("الكل", "All"), icon: Coffee };
  const categories = [
    allTab,
    ...dynamicCategories.map(c => ({
      id: c.id,
      name: i18n.language === 'ar' ? c.nameAr : (c.nameEn || c.nameAr),
      icon: iconMap[c.icon || 'Coffee'] || Coffee,
    })),
  ];

  const getGroupingKey = (item: CoffeeItem): string => {
    if ((item as any).groupId) return `${item.category}::${(item as any).groupId}`;
    const nameAr = item.nameAr || "";
    if (!nameAr || typeof nameAr !== 'string') return `${item.category}::unknown`;
    const cleaned = nameAr.trim().replace(/^[\u064B-\u0652]+/, '');
    const firstWord = cleaned.split(/\s+/)[0] || 'unknown';
    return `${item.category}::${firstWord}`;
  };

  const groupedItems = useMemo(() => coffeeItems.reduce((acc: Record<string, CoffeeItem[]>, item) => {
    const key = getGroupingKey(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {}), [coffeeItems]);

  const representativeItems = useMemo(() =>
    Object.values(groupedItems).map(group => group[0]),
    [groupedItems]
  );

  const filteredItems = useMemo(() => {
    return representativeItems
      .filter(item => {
        const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
        const name = i18n.language === 'ar' ? item.nameAr : item.nameEn || item.nameAr;
        const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => ((b as any).salesCount || 0) - ((a as any).salesCount || 0));
  }, [representativeItems, selectedCategory, searchQuery, i18n.language]);

  const maxSalesCount = useMemo(() => {
    if (!coffeeItems.length) return 0;
    return Math.max(0, ...coffeeItems.map(item => (item as any).salesCount || 0));
  }, [coffeeItems]);

  const cartTotal = useMemo(() =>
    cart.reduce((sum, entry) => sum + entry.price * entry.quantity, 0),
    [cart]
  );
  const cartItemCount = useMemo(() =>
    cart.reduce((sum, entry) => sum + entry.quantity, 0),
    [cart]
  );

  const handleItemClick = (item: CoffeeItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleAddToCart = (cartItemData: any) => {
    if (!selectedItem) return;
    const price = typeof selectedItem.price === 'number' ? selectedItem.price : parseFloat(String(selectedItem.price) || '0');
    const key = `${(selectedItem as any).id}-${cartItemData.selectedSize}`;
    setCart(prev => {
      const existing = prev.findIndex(e => e.key === key);
      if (existing >= 0) {
        return prev.map((e, i) => i === existing ? { ...e, quantity: e.quantity + (cartItemData.quantity || 1) } : e);
      }
      return [...prev, {
        key,
        cartItem: cartItemData,
        nameAr: selectedItem.nameAr,
        nameEn: (selectedItem as any).nameEn,
        price,
        imageUrl: selectedItem.imageUrl,
        quantity: cartItemData.quantity || 1,
      }];
    });
    toast({
      title: tc("تمت الإضافة ✓", "Added ✓"),
      description: i18n.language === 'ar' ? selectedItem.nameAr : ((selectedItem as any).nameEn || selectedItem.nameAr),
    });
  };

  const removeFromCart = (key: string) => {
    setCart(prev => prev.filter(e => e.key !== key));
  };

  const changeQty = (key: string, delta: number) => {
    setCart(prev => prev.map(e => {
      if (e.key !== key) return e;
      const newQty = e.quantity + delta;
      return newQty <= 0 ? null! : { ...e, quantity: newQty };
    }).filter(Boolean));
  };

  const handleSendOrder = () => {
    if (cart.length === 0) return;
    const items = cart.map(entry => ({
      coffeeItemId: entry.cartItem.coffeeItemId,
      name: entry.nameAr,
      nameAr: entry.nameAr,
      nameEn: entry.nameEn,
      quantity: entry.quantity,
      price: entry.price,
      selectedSize: entry.cartItem.selectedSize,
      selectedAddons: entry.cartItem.selectedAddons || [],
      imageUrl: entry.imageUrl,
    }));
    const totalAmount = cartTotal;
    sendOrderMutation.mutate({
      items,
      totalAmount,
      paymentMethod: 'cash',
      orderType: 'dine-in',
      channel: 'customer-menu',
      status: 'pending',
      customerNote: customerNote.trim() || undefined,
      customerName: customerNote.trim() || tc('عميل المنيو', 'Menu Customer'),
      notes: customerNote.trim() || undefined,
      source: 'menu',
    });
  };

  if (isLoading) {
    return (
      <div dir={dir} className="min-h-screen bg-[#1a0f08] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Coffee className="w-10 h-10 text-[#D4912A]" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0EA] dark:bg-[#0f0a06]" dir={dir}>

      {/* ── Fixed Header ── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#3D1A0A]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-3">
          <img src={tasaliLogo} alt="تسالي كرومش" className="w-10 h-10 object-contain rounded-xl" />
          <div className="flex flex-col leading-none">
            <span className="text-white font-black text-sm tracking-wide">تسالي كرومش</span>
            <span className="text-[#D4912A] text-[10px] font-bold tracking-widest uppercase opacity-80">TASALI QURUMSH</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${
            isStoreOpen()
              ? 'bg-green-500/20 border-green-500/40 text-green-400'
              : 'bg-red-500/20 border-red-500/40 text-red-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isStoreOpen() ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            {isStoreOpen() ? tc('مفتوح', 'Open') : tc('مغلق', 'Closed')}
          </div>

          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            data-testid="button-toggle-language"
          >
            <Languages className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const storedCustomer = localStorage.getItem("qahwa-customer") || localStorage.getItem("currentCustomer");
              if (isAuthenticated || customer || storedCustomer) {
                setLocation("/profile");
              } else {
                setLocation("/auth");
              }
            }}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            data-testid="button-profile"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Brand Hero ── */}
      <div className="pt-16">
        <div className="relative bg-gradient-to-b from-[#3D1A0A] via-[#5C2A10] to-[#F5F0EA] dark:to-[#0f0a06] pb-10">
          <div className="max-w-md mx-auto px-6 pt-10 pb-4 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-24 h-24 mx-auto mb-4 rounded-3xl overflow-hidden shadow-2xl shadow-black/40 border-2 border-[#D4912A]/40"
            >
              <img src={tasaliLogo} alt="تسالي كرومش" className="w-full h-full object-contain bg-white/10 p-1" />
            </motion.div>
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-3xl font-black text-white mb-1"
            >
              تسالي كرومش
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-[#D4912A] text-sm font-bold tracking-widest uppercase mb-1"
            >
              TASALI QURUMSH
            </motion.p>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-white/60 text-xs flex items-center justify-center gap-1.5"
            >
              <MapPin className="w-3 h-3 text-[#D4912A]" />
              {tc('الرياض، المملكة العربية السعودية', 'Riyadh, Saudi Arabia')}
            </motion.p>
          </div>
        </div>

        {/* ── Content Area ── */}
        <div className="max-w-md mx-auto px-4 pb-40 space-y-5 -mt-4">

          {/* ── Search ── */}
          <div className="relative">
            <Search className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D3D0F]/50`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={tc('ابحث عن منتج...', 'Search products...')}
              className={`w-full h-12 ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} bg-white dark:bg-white/10 border border-[#7D3D0F]/20 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#7D3D0F]/30 shadow-sm`}
              data-testid="input-search"
            />
          </div>

          {/* ── Category Tabs ── */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            {categories.map((cat) => {
              const IconComp = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                    isActive
                      ? 'bg-[#7D3D0F] text-white border-[#7D3D0F] shadow-md shadow-[#7D3D0F]/30'
                      : 'bg-white dark:bg-white/10 text-[#7D3D0F] dark:text-foreground border-[#7D3D0F]/20 hover:border-[#7D3D0F]/40'
                  }`}
                  data-testid={`button-category-${cat.id}`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#D4912A]'}`} />
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* ── Count ── */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">
              {filteredItems.length} {tc('منتج', 'items')}
            </p>
            {!isStoreOpen() && (
              <div className="flex items-center gap-1 text-xs text-red-500 font-bold">
                <Clock className="w-3 h-3" />
                {tc('المتجر مغلق حالياً', 'Store currently closed')}
              </div>
            )}
          </div>

          {/* ── Products Grid ── */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Coffee className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-bold">{tc('لا توجد منتجات', 'No products found')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <AnimatePresence>
                {filteredItems.map((item, index) => {
                  const name = i18n.language === 'ar' ? item.nameAr : item.nameEn || item.nameAr;
                  const nameSecondary = i18n.language === 'ar' ? item.nameEn : item.nameAr;
                  const isAvailable = item.isAvailable !== 0;
                  const salesCount = (item as any).salesCount || 0;
                  const isNew = (item as any).isNewProduct === 1;
                  const isBestSeller = salesCount > 0 && maxSalesCount > 0 && salesCount >= maxSalesCount * 0.6;
                  const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price) || '0');
                  const cartKey = `${(item as any).id}-default`;
                  const inCart = cart.find(e => e.key.startsWith(`${(item as any).id}-`));

                  return (
                    <motion.button
                      key={(item as any).id || index}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.4) }}
                      onClick={() => handleItemClick(item)}
                      className="group relative bg-white dark:bg-white/8 rounded-2xl overflow-hidden border border-[#7D3D0F]/10 hover:border-[#D4912A]/40 shadow-sm hover:shadow-md transition-all text-start active:scale-[0.98]"
                      data-testid={`card-product-${(item as any).id}`}
                    >
                      {/* Product Image */}
                      <div className="relative aspect-[4/3] bg-gradient-to-br from-[#F5E8D5] to-[#EDD8B5] dark:from-[#2a1208] dark:to-[#1a0c05] overflow-hidden">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = 'none';
                              img.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`${item.imageUrl ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                          <img src={tasaliLogo} alt={name} className="w-16 h-16 object-contain opacity-30" />
                        </div>

                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {isBestSeller && (
                            <div className="bg-[#D4912A] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                              ⭐ {tc('الأكثر طلباً', 'Best Seller')}
                            </div>
                          )}
                          {isNew && (
                            <div className="bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                              ✨ {tc('جديد', 'New')}
                            </div>
                          )}
                        </div>

                        {/* In-cart indicator */}
                        {inCart && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#7D3D0F] flex items-center justify-center shadow-md">
                            <span className="text-white text-[10px] font-black">{inCart.quantity}</span>
                          </div>
                        )}

                        {/* Unavailable overlay */}
                        {!isAvailable && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-[11px] font-bold bg-black/60 px-2 py-1 rounded-lg">
                              {tc('غير متوفر', 'Unavailable')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-3 space-y-1">
                        <h3 className="font-black text-[#3D1A0A] dark:text-foreground text-sm leading-snug line-clamp-1">{name}</h3>
                        {nameSecondary && nameSecondary !== name && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1">{nameSecondary}</p>
                        )}
                        <div className="flex items-center justify-between pt-0.5">
                          <span className="text-[#7D3D0F] dark:text-[#D4912A] font-black text-base">
                            {isNaN(price) ? '—' : price.toFixed(2)}
                            <span className="text-[10px] font-normal mr-0.5 opacity-70">
                              <SarIcon />
                            </span>
                          </span>
                          <div className="w-7 h-7 rounded-lg bg-[#7D3D0F] flex items-center justify-center shadow-sm">
                            <Plus className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* ── Footer ── */}
          <div className="pt-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <a href="tel:+966566507666" className="flex items-center gap-1 hover:text-[#7D3D0F] transition-colors" data-testid="link-footer-call">
                <Phone className="w-3 h-3" />
                <span dir="ltr">+966 56 650 7666</span>
              </a>
              <span className="text-muted-foreground/30">•</span>
              <a
                href="https://maps.app.goo.gl/zhHFfQVjWRxVKEBn6?g_st=ic"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-[#7D3D0F] transition-colors"
                data-testid="link-footer-maps"
              >
                <MapPin className="w-3 h-3" />
                {tc('موقعنا', 'Location')}
              </a>
            </div>
            <p className="text-[10px] text-muted-foreground/40">
              {tc('جميع الأسعار شاملة الضريبة', 'All prices include VAT')}
            </p>
            <a
              href="https://qiroxstudio.online"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/50 hover:text-[#7D3D0F] transition-colors mt-1"
              data-testid="link-qirox-studio"
            >
              <span>صنع عبر</span>
              <span className="font-black tracking-wide text-[#D4912A]/70 hover:text-[#D4912A]">QIROX STUDIO</span>
              <span className="text-[8px]">↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── Floating Cart Button ── */}
      <AnimatePresence>
        {cart.length > 0 && !isCartOpen && (
          <motion.button
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-6 inset-x-4 max-w-md mx-auto z-40 bg-[#7D3D0F] hover:bg-[#6B3310] text-white rounded-2xl shadow-xl shadow-[#7D3D0F]/40 flex items-center justify-between px-5 py-4 transition-colors"
            data-testid="button-open-cart"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#D4912A] rounded-full text-[10px] font-black flex items-center justify-center">
                  {cartItemCount}
                </span>
              </div>
              <span className="font-bold text-sm">{tc('عرض الطلب', 'View Order')}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-black text-base">{cartTotal.toFixed(2)}</span>
              <SarIcon />
              <ChevronUp className="w-4 h-4 opacity-70 mr-1" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Cart Sheet (Bottom Drawer) ── */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 35 }}
              className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-[#1a0c05] rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
              dir={dir}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-white/20" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3 pt-1 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#7D3D0F]" />
                  <h2 className="font-black text-[#3D1A0A] dark:text-white text-base">
                    {tc('طلبك', 'Your Order')}
                  </h2>
                  <span className="bg-[#7D3D0F] text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                    {cartItemCount}
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center"
                  data-testid="button-close-cart"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-white/60" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
                {cart.map(entry => {
                  const name = i18n.language === 'ar' ? entry.nameAr : (entry.nameEn || entry.nameAr);
                  return (
                    <div key={entry.key} className="flex items-center gap-3 bg-[#F5F0EA] dark:bg-white/5 rounded-2xl p-3">
                      {entry.imageUrl ? (
                        <img src={entry.imageUrl} alt={name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#7D3D0F]/10 flex items-center justify-center flex-shrink-0">
                          <Coffee className="w-5 h-5 text-[#7D3D0F]/50" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#3D1A0A] dark:text-white text-sm line-clamp-1">{name}</p>
                        <p className="text-[#7D3D0F] dark:text-[#D4912A] font-black text-sm">
                          {(entry.price * entry.quantity).toFixed(2)} <SarIcon />
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => changeQty(entry.key, -1)}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center"
                          data-testid={`button-decrease-${entry.key}`}
                        >
                          <Minus className="w-3 h-3 text-gray-600 dark:text-white/60" />
                        </button>
                        <span className="w-5 text-center font-black text-sm text-[#3D1A0A] dark:text-white">{entry.quantity}</span>
                        <button
                          onClick={() => changeQty(entry.key, 1)}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center"
                          data-testid={`button-increase-${entry.key}`}
                        >
                          <Plus className="w-3 h-3 text-gray-600 dark:text-white/60" />
                        </button>
                        <button
                          onClick={() => removeFromCart(entry.key)}
                          className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center"
                          data-testid={`button-remove-${entry.key}`}
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Note Field */}
                <div className="bg-[#F5F0EA] dark:bg-white/5 rounded-2xl p-4 space-y-2">
                  <label className="text-sm font-bold text-[#3D1A0A] dark:text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#D4912A]" />
                    {tc('ملاحظة للكاشير', 'Note to Cashier')}
                  </label>
                  <textarea
                    value={customerNote}
                    onChange={e => setCustomerNote(e.target.value)}
                    placeholder={tc('مثلاً: اسمك، رقم الطاولة، أو أي طلب خاص...', 'e.g. your name, table number, or special request...')}
                    rows={3}
                    className="w-full bg-white dark:bg-white/10 border border-[#7D3D0F]/20 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#7D3D0F]/30 resize-none"
                    data-testid="textarea-customer-note"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 pb-6 pt-3 border-t border-gray-100 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground font-medium">{tc('الإجمالي', 'Total')}</span>
                  <span className="text-xl font-black text-[#7D3D0F] dark:text-[#D4912A]">
                    {cartTotal.toFixed(2)} <SarIcon />
                  </span>
                </div>
                <button
                  onClick={handleSendOrder}
                  disabled={sendOrderMutation.isPending}
                  className="w-full bg-[#7D3D0F] hover:bg-[#6B3310] disabled:opacity-60 text-white font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#7D3D0F]/30 transition-colors"
                  data-testid="button-send-order"
                >
                  {sendOrderMutation.isPending ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <Coffee className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {tc('عرض الطلب للكاشير', 'Show Order to Cashier')}
                    </>
                  )}
                </button>
                <p className="text-center text-[11px] text-muted-foreground">
                  {tc('سيتم الدفع عند الاستلام في الكاشير', 'Payment will be collected at the cashier')}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Order Success Modal ── */}
      <AnimatePresence>
        {orderSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white dark:bg-[#1a0c05] rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl"
              dir={dir}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5"
              >
                <CheckCircle className="w-10 h-10 text-green-500" />
              </motion.div>
              <h2 className="text-xl font-black text-[#3D1A0A] dark:text-white mb-2">
                {tc('تم إرسال طلبك!', 'Order Sent!')}
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                {tc('وصل طلبك للكاشير وسيتم تحضيره قريباً', 'Your order reached the cashier and will be prepared soon')}
              </p>
              <div className="bg-[#F5F0EA] dark:bg-white/5 rounded-2xl px-6 py-3 mb-6">
                <p className="text-[11px] text-muted-foreground mb-1">{tc('رقم الطلب', 'Order Number')}</p>
                <p className="text-2xl font-black text-[#7D3D0F] dark:text-[#D4912A]">#{orderSuccess.orderNumber}</p>
              </div>
              <button
                onClick={() => setOrderSuccess(null)}
                className="w-full bg-[#7D3D0F] hover:bg-[#6B3310] text-white font-black py-3.5 rounded-2xl text-sm transition-colors"
                data-testid="button-success-close"
              >
                {tc('حسناً', 'Got it')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Item Detail Modal ── */}
      <AddToCartModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        variants={selectedItem ? (groupedItems[getGroupingKey(selectedItem)] || [selectedItem]) : []}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
