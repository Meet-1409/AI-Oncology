# Frontend Engineering Blueprint

Planning only. **No implementation code exists in this folder, and none should be written until this blueprint is approved.**

Source of truth for *what* the product is: `READ THIS/`.
This folder covers *how* it will be engineered.

Citation format used throughout: `[00 §10.1]` = `READ THIS/00_Ground_Rules`, section 10.1.

---

## Documents

| File | Contents |
|---|---|
| `00_Architecture.md` | Overall architecture, justification, folder organization, scalability |
| `01_Experience_Architecture.md` | Application flow, navigation philosophy, landing, journeys, screen map |
| `02_Motion_And_3D.md` | Motion, animation, transition, camera, 3D and Digital Twin interaction |
| `03_Design_System.md` | Design language, color, typography, spacing |
| `04_Component_System.md` | Component philosophy, component list, global behaviour, responsive |
| `05_Data_State_Quality.md` | API, state, loading, errors, empty states, signals, accessibility, performance, testing, code quality, future |

---

## Topic index — all 35 requested topics

| # | Topic | Location |
|---|---|---|
| 1 | Overall frontend architecture | `00` §1 |
| 2 | Why this architecture is suitable | `00` §2 |
| 3 | Complete application flow | `01` §1 |
| 4 | Navigation philosophy | `01` §2 |
| 5 | Motion design philosophy | `02` §1 |
| 6 | 3D interaction philosophy | `02` §4 |
| 7 | Design language | `03` §1 |
| 8 | Color system | `03` §2 |
| 9 | Typography system | `03` §3 |
| 10 | Spacing system | `03` §4 |
| 11 | Component philosophy | `04` §1 |
| 12 | Animation philosophy | `02` §1 |
| 13 | Transition philosophy | `02` §2 |
| 14 | Camera movement philosophy | `02` §3 |
| 15 | Digital Twin interaction design | `02` §5 |
| 16 | Landing experience flow | `01` §3 |
| 17 | Patient journey | `01` §4 |
| 18 | Oncologist journey | `01` §5 |
| 19 | Complete screen map | `01` §6 |
| 20 | Reusable component list | `04` §2 |
| 21 | Global component behavior | `04` §3 |
| 22 | Responsive behavior | `04` §4 |
| 23 | Accessibility strategy | `05` §7 |
| 24 | Performance strategy | `05` §8 |
| 25 | Loading strategy | `05` §3 |
| 26 | Error handling strategy | `05` §4 |
| 27 | Empty state strategy | `05` §5 |
| 28 | Notification strategy | `05` §6 |
| 29 | API integration strategy | `05` §1 |
| 30 | State management strategy | `05` §2 |
| 31 | Folder organization strategy | `00` §4 |
| 32 | Scalability strategy | `00` §5 |
| 33 | Testing strategy | `05` §9 |
| 34 | Code quality strategy | `05` §10 |
| 35 | Future expansion strategy | `05` §11 |

---

## Decisions confirmed with the Product Owner

| # | Decision |
|---|---|
| D1 | Clean rebuild; salvage only types, mock data, format/status utilities, low-level Radix wrappers |
| D2 | Custom stylized low-poly anatomy for the Digital Twin |
| D3 | Dedicated motion library (Motion / Framer Motion) for shared-element continuity |
| D4 | Modern evergreen browsers, WebGL2 assumed; non-3D equivalent required but not the common case |

---

## Open assumptions requiring approval

These are engineering judgements, not documented requirements. Each is marked **[ASSUMPTION]** at its location.

| # | Assumption | Location | Impact if wrong |
|---|---|---|---|
| A1 | Patients use the same `/patient/:id` URL shape, scoped to themselves | `00` §3.3 | Route tree reshaped; low cost |
| A2 | Proposed global keyboard bindings (`Cmd+K`, `Escape`, `[` `]`) | `01` §2.5 | Rebind; low cost |
| A3 | Contract-first data layer with swappable mock → HTTP adapter | `05` §1.2 | Significant rework if a different integration model is wanted |
| A4 | Polling for report processing status; no realtime transport | `05` §1.5 | Adds a transport if instant delivery is required |
| A5 | Unread Signals shown without alarm-style red badging | `05` §6 | Visual only |
| A6 | WCAG 2.2 AA as the accessibility target | `05` §7 | Higher target = more effort; lower = compliance risk |
| A7 | Specific performance budget numbers | `05` §8.1 | Budgets retuned |
| A8 | Vitest + Testing Library + Playwright + axe as test tooling | `05` §9 | Tooling swap; low cost |

**A3 is the one worth deciding deliberately** — it shapes the entire data layer and is expensive to change later.

---

## What happens next

Awaiting approval. On approval, implementation follows the phase order in `[06_Frontend_Implementation_Plan]`: environment first (spatial shell → motion system → 3D foundation → shared components), then spaces, then features.

Per `[00 §17.7]`, each completed feature is verified against every project document before the next begins.
