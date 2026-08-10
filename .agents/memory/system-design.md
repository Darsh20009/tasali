---
name: System Design & Theme Decisions
description: Color palette, system mode switcher, sidebar structure — durable decisions for Tasali Qurumsh
---

## Color Palette — سنيل (Warm Beige/Camel)
User explicitly chose: warm human sandy colors (سنيل), no purple, no blue, no AI-techy feel.
- Light: `--primary: 27 52% 38%` (warm caramel) / `--background: 36 38% 97%` (warm cream)
- Dark: `--primary: 33 55% 55%` (lighter caramel) / `--background: 22 18% 8%` (dark warm cocoa)
- NO cold greys, NO purple, NO teal — keep warm undertones throughout

**Why:** User asked for "طابع إنساني / سنيل" — human, warm, natural palette combining BlackRose structure + Clony minimalism + Tasali warmth.

**How to apply:** Any new UI component should use `text-primary`, `bg-primary`, `text-muted-foreground` etc from CSS vars — do NOT hardcode hex colors.

## System Mode Switcher
File: `client/src/lib/system-mode.tsx`
- `SystemModeProvider` wraps the app in `App.tsx`
- `useSystemMode()` returns `{ mode, setMode, isPOS, isMenu }`
- Stored in `localStorage` key `qirox-system-mode`
- Two modes: `'pos'` (full system) | `'menu'` (digital menu only)
- Selector UI: `SystemModeSection` component inside `admin-settings.tsx` (tab key: `'system'`)

**Why:** User wants admin to choose between full POS system or menu-only website mode.

**How to apply:** Sidebar uses `isPOS` from `useSystemMode()` to filter nav items. New features that should be hidden in menu mode should check `isPOS`.

## Admin Sidebar (Foodics-style)
File: `client/src/components/admin-sidebar.tsx`
- TOP_ITEMS: الملخص / الطلبات / العملاء / POS — filtered by `isPOS`
- NAV_GROUPS: collapsible with ChevronDown — filtered by `isPOS || ['menu','marketing','management'].includes(key)`
- Active indicator: right-edge 3px bar on active item

## MobileBottomNav
File: `client/src/components/MobileBottomNav.tsx`
- Permanently disabled (returns null) — user requested removal
- Keep the file/import to avoid breaking all the pages that import it
