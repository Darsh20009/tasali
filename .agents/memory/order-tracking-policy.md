---
name: Order Tracking Policy
description: Product decision for customer order-progress tracking and invoice QR codes.
---

Customer order-progress tracking is disabled by default. It may be re-enabled only from the administrator settings. The ZATCA tax QR remains available regardless of the tracking setting.

**Why:** The requested customer experience is a completed, paid order after successful payment rather than an ongoing customer tracking flow, while tax-invoice compliance must remain intact.

**How to apply:** Treat links, barcodes, QR codes, public tracking endpoints, and customer tracking UI as one opt-in feature. Do not remove or conditionally hide the ZATCA QR with this setting.