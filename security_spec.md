# AstroFlame Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants & Master Source of Truth

1. **Zero-Trust Default Deny**: All unmatched paths in `/databases/{database}/documents/{document=**}` are unconditionally denied (`allow read, write: if false;`).
2. **Verified Researcher Identity**: All write operations (`create`, `update`, `delete`) across `psi_annotations`, `saved_simulations`, and `custom_rankings` require an authenticated user with a verified email (`request.auth != null && request.auth.token.email_verified == true`) whose `request.auth.uid` strictly matches `authorUid`.
3. **Explicit Query-Enforced Read Visibility**: Neither `get` nor `list` operations allow blanket `isSignedIn()` reads. Every read must satisfy `resource.data.authorUid == request.auth.uid || resource.data.visibility == 'research_shared'`.
4. **Strict Schema & Volumetric Bounds**: Every string field enforces exact `minLength`, `maxLength`, and regex/enum constraints derived verbatim from `firebase-blueprint.json`. Document IDs are validated via `isValidId()` (`<= 128` chars, `^[a-zA-Z0-9_\-]+$`) on all single-document operations (`get`, `create`, `update`, `delete`).
5. **Temporal & Ownership Immutability**: `createdAt` and `updatedAt` must equal `request.time` on creation; on update, `authorUid` and `createdAt` are immutable and `updatedAt` must equal `request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Identity Spoofing on Create**: Authenticated user `uid_alice` attempts to create a `psi_annotations` document with `authorUid: "uid_bob"`. -> `PERMISSION_DENIED`
2. **Unverified Email Write**: Authenticated user with `email_verified: false` attempts to create a `saved_simulations` document. -> `PERMISSION_DENIED`
3. **Shadow / Ghost Field Injection**: User includes an undeclared field `"isAdmin": true` in `psi_annotations` creation or update. -> `PERMISSION_DENIED`
4. **Denial-of-Wallet String Overflow**: User sends a 5,000-character string in `hypothesisNote` (exceeding `maxLength: 2000`). -> `PERMISSION_DENIED`
5. **Document ID Poisoning**: User attempts to `create` a document at `/psi_annotations/invalid$id!with*spaces`. -> `PERMISSION_DENIED`
6. **Blanket Unfiltered List Query**: Authenticated user executes an unfiltered `getDocs(collection(db, 'psi_annotations'))` where private documents of other users exist. -> `PERMISSION_DENIED`
7. **Cross-Owner Private Document Read**: User `uid_alice` attempts `getDoc` on a document owned by `uid_bob` with `visibility: "private"`. -> `PERMISSION_DENIED`
8. **Ownership Hijack on Update**: Owner attempts to update `authorUid` to another user's UID during an update action. -> `PERMISSION_DENIED`
9. **Timestamp Forgery on Create/Update**: Client supplies a backdated timestamp (`createdAt: Timestamp.fromMillis(1000)`) instead of `serverTimestamp()` (`request.time`). -> `PERMISSION_DENIED`
10. **Out-of-Range Numeric Telemetry Poisoning**: User submits `oxygenPercent: 999` or `gravityG: -5` in `saved_simulations`. -> `PERMISSION_DENIED`
11. **Invalid Enum Pillar Tag**: User submits `pillarTag: "RocketPropulsion"` (not in `['Prevention', 'Detection', 'Suppression']`). -> `PERMISSION_DENIED`
12. **Unauthorized Cross-User Delete**: Authenticated user `uid_alice` attempts to delete a shared `custom_rankings` preset created by `uid_bob`. -> `PERMISSION_DENIED`
