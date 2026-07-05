import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslate } from "@/lib/useTranslate";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Coffee, Flame, Snowflake, Star, Cake, Utensils, Sparkles,
  Languages, Phone, MapPin, Clock, Search, X, ChevronDown,
  User, ArrowLeft,
} from "lucide-react";
import tasaliLogo from "@assets/logo.png";
import type { CoffeeItem, IProductAddon } from "@shared/schema";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useTranslation } from "react-i18next";
import SarIcon from "@/components/sar-icon";

interface MenuCategory {
  id: string;
  nameAr: string;
  nameEn?: string;
  icon?: string;
  department?: "drinks" | "food";
  orderIndex: number;
}

/* ────────────────────────────────────────────────
   THEME TOKENS
──────────────────────────────────────────────── */
const T = {
  bg:        "#0d0603",
  card:      "#1a0c05",
  cardBorder:"rgba(212,145,42,0.12)",
  gold:      "#D4912A",
  goldLight: "#E8B060",
  cream:     "#F5E8D5",
  brown:     "#7D3D0F",
  brownDeep: "#3D1A0A",
  glass:     "rgba(255,255,255,0.04)",
  glassBorder:"rgba(255,255,255,0.08)",
};

export default function MenuPage() {
  const tc = useTranslate();
  const [, setLocation] = useLocation();
  const { i18n } = useTranslation();
  const dir = i18n.language === "ar" ? "rtl" : "ltr";

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CoffeeItem | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 220], [1, 0]);
  const heroScale  = useTransform(scrollY, [0, 220], [1, 0.92]);

  /* ── Data fetching ── */
  const { data: coffeeItems = [], isLoading } = useQuery<CoffeeItem[]>({
    queryKey: ["/api/coffee-items"],
  });
  const { data: dynamicCategories = [] } = useQuery<MenuCategory[]>({
    queryKey: ["/api/menu-categories"],
  });
  const { data: businessConfig } = useQuery<any>({
    queryKey: ["/api/business-config"],
  });

  /* ── Store open logic ── */
  const storeOpen = useMemo(() => {
    if (!businessConfig) return true;
    if (businessConfig.isEmergencyClosed) return false;
    const storeHours = businessConfig.storeHours || {};
    const alwaysOpen = Object.values(storeHours).every(
      (h: any) => h?.isAlwaysOpen || (h?.open === "00:00" && h?.close === "23:59")
    );
    if (alwaysOpen) return true;
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Riyadh",
      hour: "2-digit", minute: "2-digit", hour12: false, weekday: "long",
    }).formatToParts(now);
    const currentDay = parts.find(p => p.type === "weekday")?.value.toLowerCase() || "monday";
    const h  = parseInt(parts.find(p => p.type === "hour")?.value   || "0");
    const m  = parseInt(parts.find(p => p.type === "minute")?.value || "0");
    const now_m = h * 60 + m;
    const hours = storeHours[currentDay];
    if (!hours?.isOpen) return false;
    if (hours.isAlwaysOpen) return true;
    const [oh, om] = (hours.open  || "06:00").split(":").map(Number);
    const [ch, cm] = (hours.close || "03:00").split(":").map(Number);
    const o_m = oh * 60 + om, c_m = ch * 60 + cm;
    return c_m <= o_m
      ? now_m >= o_m || now_m <= c_m
      : now_m >= o_m && now_m <= c_m;
  }, [businessConfig]);

  /* ── Categories ── */
  const iconMap: Record<string, any> = { Coffee, Flame, Snowflake, Star, Cake, Utensils, Sparkles };
  const categories = useMemo(() => [
    { id: "all", nameAr: "الكل", nameEn: "All", icon: Coffee },
    ...dynamicCategories.map(c => ({
      id: c.id,
      nameAr: c.nameAr,
      nameEn: c.nameEn || c.nameAr,
      icon: iconMap[c.icon || "Coffee"] || Coffee,
    })),
  ], [dynamicCategories]);

  /* ── Grouping & filtering ── */
  const groupedItems = useMemo(() =>
    coffeeItems.reduce((acc: Record<string, CoffeeItem[]>, item) => {
      const key = `${item.category}::${(item as any).groupId || (item as any).id || item.nameAr}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {}),
  [coffeeItems]);

  const representativeItems = useMemo(() =>
    Object.values(groupedItems).map(g => g[0]),
  [groupedItems]);

  const maxSales = useMemo(() =>
    Math.max(0, ...coffeeItems.map(i => (i as any).salesCount || 0)),
  [coffeeItems]);

  const filteredItems = useMemo(() =>
    representativeItems
      .filter(item => {
        const cat   = selectedCategory === "all" || item.category === selectedCategory;
        const name  = i18n.language === "ar" ? item.nameAr : (item as any).nameEn || item.nameAr;
        const match = name.toLowerCase().includes(searchQuery.toLowerCase());
        return cat && match;
      })
      .sort((a, b) => ((b as any).salesCount || 0) - ((a as any).salesCount || 0)),
  [representativeItems, selectedCategory, searchQuery, i18n.language]);

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div dir={dir} className="min-h-screen flex flex-col items-center justify-center gap-6"
        style={{ background: T.bg }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Coffee className="w-10 h-10" style={{ color: T.gold }} />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-sm font-bold tracking-widest uppercase"
          style={{ color: T.gold, opacity: 0.6 }}
        >
          Tasali Qurumsh
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-screen select-none" dir={dir} style={{ background: T.bg, fontFamily: "'IBM Plex Sans Arabic','Tajawal',sans-serif" }}>

      {/* ══════════════════════════════════════════════
          TOP NAV — floating glass bar
      ══════════════════════════════════════════════ */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 h-14"
        style={{
          background: "rgba(13,6,3,0.80)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${T.glassBorder}`,
        }}>
        {/* Logo + Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl overflow-hidden border flex-shrink-0"
            style={{ borderColor: `${T.gold}30` }}>
            <img src={tasaliLogo} alt="تسالي كرومش" className="w-full h-full object-cover" />
          </div>
          <div className="leading-none">
            <p className="text-white font-black text-sm">تسالي كرومش</p>
            <p className="font-bold tracking-widest text-[9px]" style={{ color: T.gold }}>TASALI QURUMSH</p>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Store badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
            storeOpen
              ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
              : "text-red-400 border-red-500/30 bg-red-500/10"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${storeOpen ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
            {storeOpen ? tc("مفتوح", "Open") : tc("مغلق", "Closed")}
          </div>

          {/* Search toggle */}
          <button
            onClick={() => setShowSearch(v => !v)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: showSearch ? T.gold : T.glass, border: `1px solid ${T.glassBorder}` }}
            data-testid="button-toggle-search"
          >
            {showSearch
              ? <X className="w-4 h-4 text-white" />
              : <Search className="w-4 h-4" style={{ color: T.cream }} />
            }
          </button>

          {/* Language */}
          <button
            onClick={() => i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar")}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: T.glass, border: `1px solid ${T.glassBorder}` }}
            data-testid="button-toggle-language"
          >
            <Languages className="w-4 h-4" style={{ color: T.cream }} />
          </button>

          {/* Profile */}
          <button
            onClick={() => setLocation("/auth")}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: T.glass, border: `1px solid ${T.glassBorder}` }}
            data-testid="button-profile"
          >
            <User className="w-4 h-4" style={{ color: T.cream }} />
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════
          SEARCH BAR — slides down
      ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0,   opacity: 1 }}
            exit={{   y: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed top-14 inset-x-0 z-40 px-4 py-2"
            style={{ background: "rgba(13,6,3,0.95)", backdropFilter: "blur(20px)" }}
          >
            <div className="relative max-w-lg mx-auto">
              <Search className={`absolute ${dir === "rtl" ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 w-4 h-4`}
                style={{ color: `${T.gold}80` }} />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={tc("ابحث عن منتج...", "Search products...")}
                className={`w-full h-11 ${dir === "rtl" ? "pr-11 pl-4" : "pl-11 pr-4"} rounded-2xl text-sm outline-none`}
                style={{
                  background: T.card,
                  border: `1px solid ${T.cardBorder}`,
                  color: T.cream,
                }}
                data-testid="input-search"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════
          HERO SECTION — cinematic brand
      ══════════════════════════════════════════════ */}
      <div ref={heroRef} className="relative pt-14 overflow-hidden" style={{ height: "70vw", maxHeight: 340, minHeight: 240 }}>
        {/* Background gradient orbs */}
        <div className="absolute inset-0" style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 0%, ${T.brown}55 0%, transparent 70%),
                       radial-gradient(ellipse 50% 60% at 85% 50%, ${T.gold}18 0%, transparent 60%),
                       radial-gradient(ellipse 50% 60% at 15% 60%, ${T.brownDeep}80 0%, transparent 60%)`,
        }} />

        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E\")" }} />

        {/* Hero content */}
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center"
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="w-20 h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden mb-4 shadow-2xl"
            style={{ border: `2px solid ${T.gold}50`, boxShadow: `0 0 40px ${T.gold}20, 0 20px 60px ${T.brownDeep}` }}
          >
            <img src={tasaliLogo} alt="تسالي كرومش"
              className="w-full h-full object-cover"
              style={{ background: T.brownDeep }} />
          </motion.div>

          <motion.h1
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl md:text-4xl font-black text-white mb-1"
            style={{ textShadow: `0 4px 24px ${T.brownDeep}` }}
          >
            تسالي كرومش
          </motion.h1>

          <motion.p
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-xs font-black tracking-[0.3em] uppercase mb-3"
            style={{ color: T.gold }}
          >
            TASALI QURUMSH
          </motion.p>

          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex items-center gap-4 text-xs"
            style={{ color: `${T.cream}70` }}
          >
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" style={{ color: T.gold }} />
              {tc("الرياض، السعودية", "Riyadh, Saudi Arabia")}
            </span>
            {!storeOpen && (
              <span className="flex items-center gap-1 text-red-400">
                <Clock className="w-3 h-3" />
                {tc("مغلق الآن", "Closed Now")}
              </span>
            )}
          </motion.div>
        </motion.div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-16"
          style={{ background: `linear-gradient(to bottom, transparent, ${T.bg})` }} />
      </div>

      {/* ══════════════════════════════════════════════
          CATEGORY TABS — sticky below hero
      ══════════════════════════════════════════════ */}
      <div className="sticky z-30" style={{ top: showSearch ? "88px" : "56px" }}>
        <div className="px-4 py-2.5" style={{ background: `${T.bg}ee`, backdropFilter: "blur(16px)", borderBottom: `1px solid ${T.glassBorder}` }}>
          <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-2xl mx-auto">
            {categories.map(cat => {
              const Icon = cat.icon;
              const active = selectedCategory === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  whileTap={{ scale: 0.93 }}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all"
                  style={{
                    background: active ? T.gold : T.glass,
                    border: `1px solid ${active ? T.gold : T.glassBorder}`,
                    color: active ? "#fff" : `${T.cream}80`,
                    boxShadow: active ? `0 0 20px ${T.gold}40` : "none",
                  }}
                  data-testid={`button-category-${cat.id}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {i18n.language === "ar" ? cat.nameAr : cat.nameEn}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          PRODUCTS — creative masonry-style grid
      ══════════════════════════════════════════════ */}
      <div className="max-w-2xl mx-auto px-3 pt-4 pb-28 space-y-3">

        {/* Count label */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold" style={{ color: `${T.cream}40` }}>
            {filteredItems.length} {tc("منتج", "products")}
          </p>
          <div className="h-px flex-1 mx-3" style={{ background: `linear-gradient(to ${dir === "rtl" ? "left" : "right"}, ${T.gold}30, transparent)` }} />
          <p className="text-xs font-bold" style={{ color: `${T.gold}70` }}>
            {tc("قائمة الطعام", "Our Menu")}
          </p>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <Coffee className="w-12 h-12 mx-auto mb-4 opacity-20" style={{ color: T.gold }} />
            <p className="font-bold" style={{ color: `${T.cream}40` }}>
              {tc("لا توجد منتجات", "No products found")}
            </p>
          </div>
        ) : (
          <ProductGrid
            items={filteredItems}
            maxSales={maxSales}
            dir={dir}
            onSelect={setSelectedItem}
            lang={i18n.language}
            tc={tc}
          />
        )}

        {/* Footer */}
        <div className="pt-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-1 mx-auto" style={{ color: `${T.cream}25` }}>
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, ${T.gold}20, transparent)` }} />
            <Star className="w-3 h-3 mx-2" style={{ color: T.gold + "50" }} />
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${T.gold}20, transparent)` }} />
          </div>
          <div className="flex items-center justify-center gap-5 text-xs" style={{ color: `${T.cream}30` }}>
            <a href="tel:+966566507666" className="flex items-center gap-1 hover:opacity-70 transition-opacity"
              data-testid="link-footer-call">
              <Phone className="w-3 h-3" style={{ color: T.gold + "60" }} />
              <span dir="ltr">+966 56 650 7666</span>
            </a>
            <span style={{ color: `${T.cream}15` }}>•</span>
            <a href="https://maps.app.goo.gl/zhHFfQVjWRxVKEBn6?g_st=ic" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 hover:opacity-70 transition-opacity"
              data-testid="link-footer-maps">
              <MapPin className="w-3 h-3" style={{ color: T.gold + "60" }} />
              {tc("الموقع", "Location")}
            </a>
          </div>
          <p className="text-[10px]" style={{ color: `${T.cream}20` }}>
            {tc("جميع الأسعار شاملة ضريبة القيمة المضافة ١٥٪", "All prices include 15% VAT")}
          </p>
          <a href="https://qiroxstudio.online" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] hover:opacity-80 transition-opacity"
            style={{ color: `${T.gold}40` }}
            data-testid="link-qirox-studio">
            صنع بواسطة <span className="font-black tracking-widest">QIROX STUDIO</span>
          </a>
        </div>
      </div>


      {/* ══════════════════════════════════════════════
          ITEM DETAIL MODAL — full screen immersive
      ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedItem && (
          <ItemDetailModal
            item={selectedItem}
            dir={dir}
            lang={i18n.language}
            tc={tc}
            maxSales={maxSales}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PRODUCT GRID — creative alternating layout
══════════════════════════════════════════════════════════ */
function ProductGrid({ items, maxSales, dir, onSelect, lang, tc }: {
  items: CoffeeItem[];
  maxSales: number;
  dir: string;
  lang: string;
  onSelect: (item: CoffeeItem) => void;
  tc: (ar: string, en: string) => string;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isFeatured = index % 7 === 0; // Every 7th item is a hero card
        const name     = lang === "ar" ? item.nameAr : (item as any).nameEn || item.nameAr;
        const nameAlt  = lang === "ar" ? (item as any).nameEn : item.nameAr;
        const price    = typeof item.price === "number" ? item.price : parseFloat(String(item.price) || "0");
        const sales    = (item as any).salesCount || 0;
        const isBest   = sales > 0 && maxSales > 0 && sales >= maxSales * 0.6;
        const isNew    = (item as any).isNewProduct === 1;
        const avail    = item.isAvailable !== 0;
        const desc     = (item as any).description || (item as any).descriptionAr || "";

        if (isFeatured) {
          return (
            <motion.button
              key={(item as any).id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.5) }}
              onClick={() => onSelect(item)}
              className="w-full text-start relative overflow-hidden rounded-3xl group active:scale-[0.99] transition-transform"
              style={{
                background: T.card,
                border: `1px solid ${T.cardBorder}`,
                boxShadow: `0 4px 24px rgba(0,0,0,0.4)`,
                minHeight: 200,
              }}
              data-testid={`card-hero-product-${(item as any).id}`}
            >
              {/* Background image */}
              {item.imageUrl && (
                <div className="absolute inset-0">
                  <img src={item.imageUrl} alt={name}
                    className="w-full h-full object-cover opacity-40 group-hover:opacity-55 group-hover:scale-105 transition-all duration-700"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="absolute inset-0"
                    style={{ background: `linear-gradient(to ${dir === "rtl" ? "left" : "right"}, ${T.brownDeep}f0 40%, ${T.brownDeep}50 100%)` }} />
                </div>
              )}

              {/* Content */}
              <div className="relative z-10 p-5 flex flex-col justify-end h-full" style={{ minHeight: 200 }}>
                {/* Badges */}
                <div className="flex gap-2 mb-auto">
                  {isBest && (
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full"
                      style={{ background: T.gold, color: "#fff" }}>
                      ⭐ {tc("الأكثر طلباً", "Best Seller")}
                    </span>
                  )}
                  {isNew && (
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full"
                      style={{ background: "#16a34a", color: "#fff" }}>
                      ✨ {tc("جديد", "New")}
                    </span>
                  )}
                  {!avail && (
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(0,0,0,0.6)", color: "rgba(255,255,255,0.6)" }}>
                      {tc("غير متوفر", "Unavailable")}
                    </span>
                  )}
                </div>

                <div className="mt-10 space-y-1">
                  <p className="text-xs font-bold tracking-widest uppercase opacity-60" style={{ color: T.gold }}>
                    {tc("منتج مميز", "Featured")}
                  </p>
                  <h2 className="text-2xl font-black text-white leading-snug">{name}</h2>
                  {nameAlt && <p className="text-sm opacity-50 text-white">{nameAlt}</p>}
                  {desc && <p className="text-xs opacity-40 text-white line-clamp-2 mt-1">{desc}</p>}
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-black" style={{ color: T.gold }}>
                      {isNaN(price) ? "—" : price.toFixed(2)}
                    </span>
                    <span className="text-sm opacity-70" style={{ color: T.gold }}>
                      <SarIcon />
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        }

        // Regular 2-column grid — rendered in pairs
        return null;
      })}

      {/* 2-column grid for non-featured items */}
      {(() => {
        const regular = items.filter((_, i) => i % 7 !== 0);
        const pairs: CoffeeItem[][] = [];
        for (let i = 0; i < regular.length; i += 2) pairs.push(regular.slice(i, i + 2));
        return pairs.map((pair, pi) => (
          <div key={pi} className="grid grid-cols-2 gap-3">
            {pair.map((item, qi) => {
              const name    = lang === "ar" ? item.nameAr : (item as any).nameEn || item.nameAr;
              const price   = typeof item.price === "number" ? item.price : parseFloat(String(item.price) || "0");
              const sales   = (item as any).salesCount || 0;
              const isBest  = sales > 0 && maxSales > 0 && sales >= maxSales * 0.6;
              const isNew   = (item as any).isNewProduct === 1;
              const avail   = item.isAvailable !== 0;
              return (
                <motion.button
                  key={(item as any).id || qi}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min((pi * 2 + qi) * 0.04, 0.6) }}
                  onClick={() => onSelect(item)}
                  className="text-start overflow-hidden rounded-2xl group active:scale-[0.97] transition-transform relative"
                  style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}
                  data-testid={`card-product-${(item as any).id}`}
                >
                  {/* Image */}
                  <div className="relative overflow-hidden" style={{ aspectRatio: "3/4" }}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={e => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = "none";
                          (img.nextElementSibling as HTMLElement)?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div className={`${item.imageUrl ? "hidden" : ""} w-full h-full flex items-center justify-center`}
                      style={{ background: `linear-gradient(135deg, ${T.brownDeep}, ${T.card})` }}>
                      <img src={tasaliLogo} alt={name} className="w-12 h-12 object-contain opacity-20" />
                    </div>

                    {/* Gradient overlay */}
                    <div className="absolute inset-0"
                      style={{ background: `linear-gradient(to top, ${T.card} 0%, transparent 50%)` }} />

                    {/* Badges */}
                    {(isBest || isNew) && (
                      <div className={`absolute top-2 ${dir === "rtl" ? "right-2" : "left-2"} flex flex-col gap-1`}>
                        {isBest && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap"
                            style={{ background: T.gold, color: "#fff" }}>
                            ⭐ {tc("الأكثر", "Best")}
                          </span>
                        )}
                        {isNew && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap"
                            style={{ background: "#16a34a", color: "#fff" }}>
                            ✨ {tc("جديد", "New")}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Unavailable overlay */}
                    {!avail && (
                      <div className="absolute inset-0 flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.65)" }}>
                        <span className="text-[11px] font-bold text-white/70 border border-white/20 px-2 py-1 rounded-lg backdrop-blur">
                          {tc("غير متوفر", "Unavailable")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 space-y-1">
                    <h3 className="font-black text-white text-sm leading-snug line-clamp-2">{name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-black" style={{ color: T.gold }}>
                        {isNaN(price) ? "—" : price.toFixed(2)}
                      </span>
                      <span className="text-[11px] opacity-70" style={{ color: T.gold }}><SarIcon /></span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        ));
      })()}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ITEM DETAIL MODAL — cinematic full-screen
══════════════════════════════════════════════════════════ */
function ItemDetailModal({ item, dir, lang, tc, maxSales, onClose }: {
  item: CoffeeItem;
  dir: string;
  lang: string;
  tc: (ar: string, en: string) => string;
  maxSales: number;
  onClose: () => void;
}) {
  const name    = lang === "ar" ? item.nameAr : (item as any).nameEn || item.nameAr;
  const nameAlt = lang === "ar" ? (item as any).nameEn : item.nameAr;
  const price   = typeof item.price === "number" ? item.price : parseFloat(String(item.price) || "0");
  const sales   = (item as any).salesCount || 0;
  const isBest  = sales > 0 && maxSales > 0 && sales >= maxSales * 0.6;
  const isNew   = (item as any).isNewProduct === 1;
  const avail   = item.isAvailable !== 0;
  const desc    = (item as any).description || (item as any).descriptionAr || (item as any).descriptionEn || "";
  const category = (item as any).categoryNameAr || (item as any).category || "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: T.bg }}
      dir={dir}
    >
      {/* Image — top half */}
      <div className="relative flex-shrink-0" style={{ height: "55vw", maxHeight: 320, minHeight: 220 }}>
        {item.imageUrl ? (
          <motion.img
            src={item.imageUrl}
            alt={name}
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full object-cover"
            onError={e => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${T.brownDeep}, ${T.card})` }}>
            <img src={tasaliLogo} alt={name} className="w-24 h-24 object-contain opacity-20" />
          </div>
        )}

        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-24"
          style={{ background: `linear-gradient(to bottom, transparent, ${T.bg})` }} />

        {/* Top fade */}
        <div className="absolute inset-x-0 top-0 h-16"
          style={{ background: `linear-gradient(to top, transparent, rgba(0,0,0,0.5))` }} />

        {/* Close button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          onClick={onClose}
          className="absolute top-4 flex items-center justify-center w-10 h-10 rounded-2xl backdrop-blur"
          style={{
            [dir === "rtl" ? "right" : "left"]: "1rem",
            background: "rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
          data-testid="button-close-item-modal"
        >
          <ArrowLeft className={`w-5 h-5 text-white ${dir === "rtl" ? "rotate-180" : ""}`} />
        </motion.button>

        {/* Unavailable overlay */}
        {!avail && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)" }}>
            <span className="text-white font-bold text-lg border border-white/30 px-6 py-3 rounded-2xl backdrop-blur">
              {tc("غير متوفر حالياً", "Currently Unavailable")}
            </span>
          </div>
        )}
      </div>

      {/* Content — bottom half */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0,  opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 overflow-y-auto px-5 pt-4 pb-32 space-y-4"
      >
        {/* Badges */}
        {(isBest || isNew) && (
          <div className="flex gap-2">
            {isBest && (
              <span className="text-[11px] font-black px-3 py-1 rounded-full"
                style={{ background: T.gold, color: "#fff" }}>
                ⭐ {tc("الأكثر طلباً", "Best Seller")}
              </span>
            )}
            {isNew && (
              <span className="text-[11px] font-black px-3 py-1 rounded-full"
                style={{ background: "#16a34a", color: "#fff" }}>
                ✨ {tc("جديد", "New")}
              </span>
            )}
          </div>
        )}

        {/* Category chip */}
        {category && (
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: `${T.gold}70` }}>
            {category}
          </p>
        )}

        {/* Name */}
        <div>
          <h2 className="text-3xl font-black text-white leading-tight">{name}</h2>
          {nameAlt && nameAlt !== name && (
            <p className="text-base mt-1 font-medium" style={{ color: `${T.cream}50` }}>{nameAlt}</p>
          )}
        </div>

        {/* Description */}
        {desc && (
          <p className="text-sm leading-relaxed" style={{ color: `${T.cream}60` }}>{desc}</p>
        )}

        {/* Divider */}
        <div className="h-px" style={{ background: `linear-gradient(to right, ${T.gold}30, transparent)` }} />

        {/* Price block */}
        <div className="flex items-center justify-between rounded-2xl p-4"
          style={{ background: T.glass, border: `1px solid ${T.cardBorder}` }}>
          <div>
            <p className="text-xs font-bold mb-1" style={{ color: `${T.cream}40` }}>
              {tc("السعر شامل الضريبة", "Price incl. VAT")}
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black" style={{ color: T.gold }}>
                {isNaN(price) ? "—" : price.toFixed(2)}
              </span>
              <span className="text-lg font-bold" style={{ color: `${T.gold}80` }}>
                <SarIcon />
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold tracking-widest mb-1" style={{ color: `${T.cream}30` }}>
              {tc("مشمول", "INCLUDED")}
            </p>
            <p className="text-xs font-bold" style={{ color: `${T.cream}50` }}>
              {tc("ض.ق.م ١٥٪", "VAT 15%")}
            </p>
          </div>
        </div>

        {/* Sales info */}
        {sales > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5 rtl:space-x-reverse">
              {[...Array(Math.min(5, Math.ceil(sales / 10)))].map((_, i) => (
                <div key={i} className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px]"
                  style={{ background: T.brownDeep, borderColor: T.gold, color: T.gold }}>
                  ★
                </div>
              ))}
            </div>
            <p className="text-xs font-bold" style={{ color: `${T.cream}40` }}>
              {tc(`طُلب ${sales} مرة`, `Ordered ${sales} times`)}
            </p>
          </div>
        )}
      </motion.div>

      {/* Bottom action — call to order */}
      <div className="fixed bottom-0 inset-x-0 p-4"
        style={{ background: `linear-gradient(to top, ${T.bg} 70%, transparent)` }}>
        <motion.a
          href="tel:+966566507666"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0,  opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-black text-white text-sm shadow-2xl"
          style={{
            background: `linear-gradient(135deg, ${T.brown}, ${T.gold})`,
            boxShadow: `0 8px 32px ${T.gold}30`,
            maxWidth: 480,
            margin: "0 auto",
          }}
          data-testid="button-call-to-order-modal"
        >
          <Phone className="w-4 h-4" />
          {tc("اتصل للطلب الآن", "Call to Order Now")}
        </motion.a>
      </div>
    </motion.div>
  );
}
