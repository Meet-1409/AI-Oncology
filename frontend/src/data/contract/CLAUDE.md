# Contract rules

v2 (`domain.v2.ts`) is current for clinical schemas. v1's workflow schemas
(session, tasks, notes, signals) are current and unchanged — do not migrate them.

- `evidence` is `.min(1)` deliberately. Never relax it to make a fixture compile.
- `patientSpaceMm` and `atlasPosition` are never derived from each other.
- Every mock fixture must supply real-shaped evidence.
- Contract changes are announced before deploy.
