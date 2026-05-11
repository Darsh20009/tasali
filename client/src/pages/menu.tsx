import { useState, useMemo } from "react";
import { useTranslate } from "@/lib/useTranslate";
import { useQuery } from "@tanstack/react-query";
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
  QrCode, 
  MapPin, 
  Clock, 
  Utensils, 
  Sparkles,
  Languages,
  Phone
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import tasaliLogo from "@assets/logo.png";
import type { CoffeeItem, IProductAddon } from "@shared/schema";
import { AddToCartModal } from "@/components/add-to-cart-modal";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { AddonPreview } from "@/components/menu-layouts";
import SarIcon from "@/components/sar-icon";

interface MenuCategory {
  id: string;
  nameAr: string;
  nameEn?: string;
  icon?: string;
  department?: 'drinks' | 'food';
  orderIndex: number;
  isSystem?: boolean;
}

const DISPLAY_ONLY = true;

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

  const handleItemClick = (item: CoffeeItem) => {
    const name = i18n.language === 'ar' ? item.nameAr : item.nameEn || item.nameAr;
    if (DISPLAY_ONLY) {
      toast({
        title: tc("للطلب اتصل بنا", "Call us to order"),
        description: tc(`اتصل على +966 56 650 7666 لطلب ${name}`, `Call +966 56 650 7666 to order ${name}`),
      });
      return;
    }
    setSelectedItem(item);
    setIsModalOpen(true);
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
        <div className="max-w-md mx-auto px-4 pb-32 space-y-5 -mt-4">

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
                  const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price) || '0');

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

                        {/* Best seller badge */}
                        {salesCount > 10 && (
                          <div className="absolute top-2 left-2 bg-[#D4912A] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                            ⭐ {tc('الأكثر طلباً', 'Best Seller')}
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
                          <div className="w-7 h-7 rounded-lg bg-[#7D3D0F]/10 group-hover:bg-[#7D3D0F] flex items-center justify-center transition-colors">
                            <Phone className="w-3.5 h-3.5 text-[#7D3D0F] group-hover:text-white transition-colors" />
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
          </div>
        </div>
      </div>


      {/* ── Item Detail Modal (shows call-us toast in DISPLAY_ONLY) ── */}
      <AddToCartModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        variants={selectedItem ? (groupedItems[getGroupingKey(selectedItem)] || [selectedItem]) : []}
        onAddToCart={() => {
          if (DISPLAY_ONLY) {
            setIsModalOpen(false);
            toast({
              title: tc("للطلب اتصل بنا", "Call us to order"),
              description: tc("اتصل على +966 56 650 7666 أو زر فرعنا في الرياض", "Call +966 56 650 7666 or visit our Riyadh branch"),
            });
          }
        }}
      />
    </div>
  );
}
