## Overview

**تسالي كرومش / TASALI QURUMSH** is a comprehensive digital management system for snack and food outlets, offering a dual-portal approach for both customer and staff interactions. The system streamlines operations, enhances customer engagement, and provides robust management tools.

**Brand Identity:**
- Arabic Name: تسالي كرومش
- English Name: TASALI QURUMSH
- Logo: Tasali Qurumsh brown/golden identity with Arabic calligraphy and crunchy snacks imagery
- Color Palette: Brown (#7D3D0F primary), Golden (#D4912A accent), Warm beige (#F5F0EA background)
- Website: tasaliqurmash.com.sa
- MongoDB Cluster: tasaliyqurmash.behfnnh.mongodb.net (requires IP whitelist 0.0.0.0/0 in Atlas)

**Business Vision & Market Potential:**
The project aims to be the leading digital solution for restaurants, enabling seamless management of orders, inventory, staff, and customer loyalty. By offering features like self-order kiosks, advanced analytics, and a local print relay, تسالي كرومش targets both small independent cafes and multi-branch enterprises, enhancing efficiency and customer experience. The system is designed for easy rebranding and scalability, with a clear tiered subscription model (Lite, Pro, Infinity) to cater to diverse business needs and unlock significant market potential in the F&B technology sector.

**Branch Location:** Riyadh, Saudi Arabia (coordinates: 24.7136, 46.6753).

**Customer Menu Mode:** The customer-facing `/menu` page operates in DISPLAY-ONLY mode (toggle via `DISPLAY_ONLY` constant in `client/src/pages/menu.tsx`). Cart, checkout, and add-to-cart UI are hidden; instead a floating "Call to Order" + map button is shown. Item modal still opens for details but its add-to-cart action shows a "call us" toast.

**Key Capabilities:**
- **Customer Portal:** Menu showcase (display-only), loyalty program, table reservations, real-time order tracking, PWA support, multi-language (Arabic/English).
- **Employee/Cashier Portal:** POS system, Kitchen Display System (KDS), table management, attendance tracking, menu management, reservation handling.
- **Manager Portal:** Comprehensive dashboards, advanced analytics, employee management, inventory control, recipe management, supplier and purchase order management, accounting (including ZATCA e-invoicing), payroll, gift cards, loyalty program configuration, delivery services, multi-branch management.
- **Admin Portal:** System-wide configuration, employee management, branch setup, reports, settings, role-based access control.
- **Driver Portal:** Order assignment, real-time GPS updates, delivery tracking.

**Navigation Cleanup (Sidebar Simplification):**
Pages kept in manager/admin navigation: Dashboard, POS, Orders, Menu Management, Kitchen Display, Shifts, Inventory (full: stock/recipes/purchase orders/suppliers), Finance (full: accounting/ZATCA/payroll/ERP), Employees, Attendance, Reports, Unified Reports, Branches, Warehouse, Settings.
Pages removed: Kiosk, Tables, Table/Product Reservations, Delivery section, AI Center, BI Analytics, Marketing (Loyalty/Promotions/Push/Suppliers), B2B/Partners/Hardware/API Management, Integrations, Support, Notifications, Email Marketing.
Employee navigation simplified to: POS, Kitchen, Orders, Attendance, Menu Management, Warehouse, Settings.

**Fixed Login Credentials:**
- Employee Gateway password: t2030 (client/src/pages/employee-gateway.tsx)
- Admin login: admin / admin (synced on server startup in server/index.ts)
- Owner login: owner / 123456 (synced on server startup in server/index.ts)

## User Preferences

I want iterative development.
Ask before making major changes.
Do not make changes to folder `server/qirox-admin.ts`.
Do not make changes to file `client/src/pages/qirox-dashboard.tsx`.
I prefer detailed explanations.
I want to be communicated with using simple language.

## System Architecture

**Core Architectural Patterns:**
- **Micro-frontend (Implicit):** Clear separation between `client/` (React frontend) and `server/` (Express backend) with `shared/` for common types and schemas.
- **Single Source of Truth for Branding:** `client/src/lib/brand.ts` centralizes all branding assets and configurations, dynamically applied via CSS custom properties.
- **Offline-first (POS):** Utilizes IndexedDB (`client/src/lib/offline-queue.ts`) for queuing orders when offline, syncing automatically when connectivity is restored.
- **Role-Based Access Control (RBAC):** Granular permissions engine (`server/permissions-engine.ts`) with 6 predefined roles and employee-level overrides.
- **Plan-Based Feature Gating:** Features are dynamically enabled/disabled based on subscription tiers defined in `client/src/lib/plan-features.ts` and managed via `server/qirox-admin.ts`.
- **Local Print Relay Agent:** A lightweight Node.js HTTP server (`public/print-relay.js`) bridges browser-to-TCP printer communication for local network printing, solving browser and LAN limitations.

**UI/UX Decisions:**
- **Unified Branding:** Dynamic color application from `brand.ts` ensures consistent theme across the application.
- **Responsive Design:** Utilizes TailwindCSS and Radix UI for adaptive layouts.
- **Multi-language Support:** Arabic (RTL) and English via `react-i18next`.
- **Consistent Theming:** Light and dark modes with a monochrome green primary color (HSL values) and IBM Plex Sans Arabic/Tajawal fonts.
- **User-Friendly Workflows:** Self-order kiosk (`/kiosk`), intuitive POS, and dedicated dashboards for different user roles.
- **Progressive Web App (PWA):** Installable application with push notifications for order status.

**Technical Implementations:**
- **Frontend:** React 18, Vite, TailwindCSS, Radix UI, TanStack Query, Framer Motion.
- **Backend:** Express.js, TypeScript (tsx).
- **Database:** MongoDB Atlas (Mongoose ODM).
- **Authentication:** Express Session (cookie: `qirox.sid`).
- **Realtime Communication:** WebSockets for live order updates and notifications.
- **Notifications:** Web Push (VAPID) and WebSocket.
- **Security:** Helmet.js, rate limiting, HPP, mongo-sanitize.
- **Payment Gateway Integration:** Geidea (card/Apple Pay), Cash, QIROX Card (loyalty).
- **Saudi Arabia Timezone (UTC+3):** All server-side "today" calculations use `getSaudiStartOfDay()` / `getSaudiEndOfDay()` for accurate day boundaries.
- **Thermal Printer Auto-Cut:** `printUnifiedReceipt` sends separate print jobs for customer and staff copies, enabling auto-cut functionality between them.
- **Reservation Product Feature:** `ICoffeeItem` schema extended with `isReservation` and `reservationPackages`, enforcing cart isolation and specific post-order flows.
- **Smart Category Deletion:** Backend handles keyword-based reassignment of orphaned items upon category deletion.
- **Forgot Password Flow:** Supports both email+phone and phone+account-name paths for wider user accessibility.
- **Payment Method Management:** `checkout.tsx` and `checkout-modal.tsx` have payment methods fully active, removing "Coming Soon" flags.
- **Auto-confirm Addons:** Products without sizes, variants, or add-ons bypass the customization dialog for faster checkout.

**Feature Specifications:**
- **POS Keyboard Shortcuts:** `/` (search), `F2` (clear search), `Escape` (clear cart), `Ctrl+F` (search), `Ctrl+P` (print receipt).
- **Gift Card Integration:** Public endpoint for customer redemption, full checkout integration.
- **Kiosk Mode:** Full-screen self-order terminal with idle auto-reset.
- **Promo Offers Management:** CRUD for bundle/discount/BOGO offers, date range, active toggle.
- **API Management:** API key generation, public/authenticated endpoint documentation browser.
- **Monthly Attendance Report:** Manager Attendance page includes daily/monthly reports with employee ranking and summary cards.
- **Cleaner Role Redirect:** `cleaner` role employees are redirected directly to attendance for an attendance-only interface.
- **Owner/Admin Dashboard Reset Orders:** New "Reset Orders Only" button deletes orders and accounting data while preserving other business data.
- **In-Cafe Live Tracking:** `CafeInternalTracking` component for dine-in orders with real-time status and waiter assignment.
- **Multi-Branch Unified Reports:** Aggregated reports across all branches for overview, comparison, and trend analysis.
- **Accounting Export:** Generates journal entries in CSV/JSON for Qoyod, Daftra, Zoho, with auto 15% VAT calculation.
- **BI Analytics:** Insights, performance, product, and pattern analysis, including day part analysis, product mix, and multi-branch comparison.

## External Dependencies

- **MongoDB Atlas:** Cloud database service for data storage.
- **SMTP2GO:** Email API service for sending transactional emails.
- **Geidea:** Payment gateway for card and Apple Pay transactions.
- **HungerStation, Jahez, ToYou, Mrsool, Careem, Noon Food, Keeta:** Delivery service providers integrated via webhooks for order processing and driver management.
- **Qoyod, Daftra, Zoho:** Accounting software for which the system generates compatible export formats.
- **Vite:** Frontend build tool.
- **TailwindCSS:** Utility-first CSS framework.
- **Radix UI:** Headless UI component library.
- **TanStack Query:** Data fetching library.
- **Framer Motion:** Animation library.
- **`react-i18next`:** Internationalization framework.
- **uuid:** Library for generating unique identifiers.