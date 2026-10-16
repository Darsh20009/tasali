---
name: Package Firewall Upgrades
description: Safe handling of blocked vulnerable transitive packages during installation.
---

When the package firewall blocks a vulnerable transitive dependency, identify its direct parent and try a patched release that stays compatible with the project's existing framework major. Use a precise package override only when the current parent line cannot resolve to the patched version safely. Avoid a major framework upgrade just to clear the firewall block.

**Why:** Upgrading Express 4 to Express 5 resolved a blocked dependency but changed Express request parameter types across the codebase, causing many existing TypeScript errors. Pinning the compatible patched transitive package retained the app's framework behavior and allowed installation.

**How to apply:** Check the locked transitive version and parent constraints, then verify the updated dependency graph, type check, build, and runtime after the smallest safe change.
