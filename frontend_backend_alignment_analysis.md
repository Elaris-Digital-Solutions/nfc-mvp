# Frontend–Backend Alignment Analysis
### Pre-Integration Audit · MVP Dynamic Cards

---

## Executive Summary

Both layers are structurally compatible. The frontend is cleanly prop-driven with well-documented integration points. The backend is production-grade with strict RBAC and lifecycle enforcement. Integration requires **no architectural changes** — only wiring and data mapping. The largest risk is the **dual-dashboard problem**: the backend has its own scaffold dashboard (`/app/(dashboard)/`) and the frontend has a richer one (`/frontend/app/(dashboard)/page.tsx`). A deliberate merge strategy is needed.

---

## 1. Data Model Alignment

### 1.1 Profile Fields Mapping

| Frontend Field (`UserProfile`) | Backend Field (`profiles` DB row) | Status | Transformation Needed |
|---|---|---|---|
| `id` | `id` | ✅ Match | None |
| `username` | `username` | ✅ Match | None |
| `name` | `full_name` | ⚠️ **Name mismatch** | `profile.full_name → UserProfile.name` |
| `email` | `email` | ✅ Match | None |
| `phone` | `phone` | ✅ Match | None |
| `whatsapp` | `whatsapp` | ✅ Match | None |
| `title` | `job_title` | ⚠️ **Name mismatch** | `profile.job_title → UserProfile.title` |
| `company` | `company` | ✅ Match | None |
| `bio` | `bio` | ✅ Match | None |
| `profileImage` | `avatar_url` | ⚠️ **Name mismatch** | `profile.avatar_url → UserProfile.profileImage` |
| `bannerImage` | `banner_url` | ⚠️ **Name mismatch** | `profile.banner_url → UserProfile.bannerImage` |
| `selectedTemplate` | `template_id` (integer) | 🔴 **Type + name mismatch** | `profile.template_id (int) → string key lookup` |
| `links` | *(not in profile row)* | ⚠️ **Separate table** | Fetch `action_buttons` and map to `LinkItem[]` |

### 1.2 Button / Link Fields Mapping

| Frontend Field (`EditableLink`) | Backend Field (`action_buttons` DB row) | Status | Transformation Needed |
|---|---|---|---|
| `id` | `id` | ✅ Match | None |
| `title` | `label` | ⚠️ **Name mismatch** | `button.label → link.title` |
| `url` | `url` | ✅ Match | None |
| `icon` | `icon` | ✅ Match | None |
| *(not in frontend)* | `sort_order` | ➕ Backend-only | Not exposed in UI; managed by backend |
| *(not in frontend)* | `is_active` | ➕ Backend-only | Could expose for toggle UI later |
| *(not in frontend)* | `profile_id` | ➕ Backend-only | Set server-side, never sent from client |
| *(not in frontend)* | `created_at` | ➕ Backend-only | Internal only |

### 1.3 Template ID Mismatch — Critical Detail

The backend stores `template_id` as an **integer** (`template_id: 1`). The frontend uses **string keys** (`'minimal-black'`). A bidirectional lookup table is needed:

```typescript
// lib/utils/template-map.ts  (NEW FILE TO CREATE)
export const TEMPLATE_ID_TO_KEY: Record<number, string> = {
  1: 'minimal-black',
}
export const TEMPLATE_KEY_TO_ID: Record<string, number> = {
  'minimal-black': 1,
}
```

### 1.4 Required Data Adapter Function

Create a single pure function to convert a DB profile row into a `UserProfile`:

```typescript
// lib/utils/adapters.ts  (NEW FILE TO CREATE)
import type { UserProfile, LinkItem } from '@/frontend/types/ui.types'
import type { Database } from '@/types/database'
import { TEMPLATE_ID_TO_KEY } from './template-map'

type DBProfile = Database['public']['Tables']['profiles']['Row']
type DBButton = Database['public']['Tables']['action_buttons']['Row']

export function dbProfileToUserProfile(
  profile: DBProfile,
  buttons: DBButton[] = []
): UserProfile {
  return {
    id: profile.id,
    username: profile.username,
    name: profile.full_name ?? '',
    email: profile.email ?? '',
    phone: profile.phone ?? undefined,
    whatsapp: profile.whatsapp ?? undefined,
    title: profile.job_title ?? undefined,
    company: profile.company ?? undefined,
    bio: profile.bio ?? undefined,
    profileImage: profile.avatar_url ?? undefined,
    bannerImage: profile.banner_url ?? undefined,
    selectedTemplate: (TEMPLATE_ID_TO_KEY[profile.template_id] ?? 'minimal-black') as any,
    links: buttons.map(dbButtonToLinkItem),
  }
}

export function dbButtonToLinkItem(button: DBButton): LinkItem {
  return {
    id: button.id,
    title: button.label,
    url: button.url,
    icon: button.icon,
  }
}
```

---

## 2. Authentication Flow Integration Plan

### 2.1 Current State

| Layer | Auth Approach |
|---|---|
| **Backend (current)** | Direct Supabase client calls in page components (`/login`, `/register`); basic primitive UI styling |
| **Frontend** | `LoginForm` / `SignupForm` components with `onLogin?` / `onSignup?` callback props; router pushes after success |
| **Middleware** | Supabase session refresh + redirect logic for `/dashboard`, `/admin`, `/login`, `/register` |

### 2.2 Target Auth Flow

```
User fills LoginForm
      ↓
onLogin(email, password) [prop callback]
      ↓
supabase.auth.signInWithPassword({ email, password })  ← browser client
      ↓ (on success)
Fetch profile: supabase.from('profiles').select('role').eq('id', user.id)
      ↓
if role === 'admin' → router.push('/admin')
else               → router.push('/dashboard')
router.refresh()   ← triggers middleware to hydrate cookie session
```

### 2.3 Implementation Approach

Replace the bare `/app/(public)/login/page.tsx` with one that uses the frontend's `LoginForm` component and passes the `onLogin` callback:

```tsx
// app/(public)/login/page.tsx  [REPLACE current bare implementation]
'use client'

import { LoginForm } from '@/frontend/components/auth/login-form'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  const handleLogin = async (email: string, password: string) => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', data.user.id).single()

    router.refresh()
    router.push(profile?.role === 'admin' ? '/admin' : '/dashboard')
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <LoginForm onLogin={handleLogin} />
    </main>
  )
}
```

Similarly for SignupForm — note that the frontend uses `cardUrl` as the `username` parameter. Wire it to `supabase.auth.signUp()` with `options.data.username`.

### 2.4 Session State Rules

| What | Where it lives | Why |
|---|---|---|
| Access token, refresh token | HTTP-only cookies (managed by `@supabase/ssr`) | Security — never in JS memory |
| `user.id` / `user.email` | Supabase server client per request | SSR-safe, no client hydration needed |
| `profile` (role, is_active) | Fetched fresh per Server Component render | Ensures lifecycle enforcement on every page load |
| `isLoading` UI state | Local `useState` in auth form | UI-only, short-lived |
| Logout | `supabase.auth.signOut()` + `router.refresh()` | Clears cookie, middleware will redirect |

### 2.5 What Must NOT Live in Frontend

- ❌ No Supabase client imports in `/frontend/**`
- ❌ No session tokens or user IDs in `localStorage`
- ❌ No role checks in frontend components (use middleware + server guards)
- ❌ No direct DB queries in client components

---

## 3. Server Actions Wiring Plan

### 3.1 Profile Update

**Frontend integration point:** `handleProfileSave` in `(dashboard)/page.tsx`

```typescript
// Current (mock):
const handleProfileSave = async () => {
  await new Promise((r) => setTimeout(r, 600))
}

// Replace with:
const handleProfileSave = async () => {
  setProfileStatus({ state: 'saving', message: 'Guardando cambios de perfil...' })
  const formData = new FormData()
  formData.append('full_name', profileForm.name)        // ← field rename
  formData.append('bio', profileForm.bio)
  formData.append('phone', profileForm.phone)
  formData.append('whatsapp', profileForm.whatsapp)
  formData.append('avatar_url', profileForm.profileImage)  // ← field rename
  formData.append('banner_url', profileForm.bannerImage)   // ← field rename
  
  const res = await updateProfile(formData)
  if (res?.error) {
    setProfileStatus({ state: 'error', message: res.error })
  } else {
    setProfileStatus({ state: 'success', message: 'Perfil actualizado correctamente.' })
  }
}
```

> [!IMPORTANT]
> The backend `updateProfile` action does NOT handle `job_title` or `company`. The frontend form has `title` and `company` inputs. Either add those fields to the server action or hide those inputs until the action is extended.

### 3.2 Image Upload

**Frontend integration point:** `handleImageUpload` with optional `onUpload` callback.

```typescript
// Create a Cloudinary upload helper:
const cloudinaryUpload = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
  formData.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!)
  
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )
  const data = await res.json()
  return data.secure_url
}

// Pass to the section:
onImageUpload('profileImage', file, cloudinaryUpload)
```

The returned URL is then stored in `profileForm.profileImage` (frontend) and sent as `avatar_url` in the FormData to `updateProfile`.

### 3.3 Buttons — CRUD Actions

**Frontend Button CRUD model vs Backend actions:**

| Frontend Action | Backend Server Action | Required Param Mapping |
|---|---|---|
| `addLink()` | `createButton(formData)` | `title → label`, `url → url`, `icon → icon` |
| `updateLink(id, ...)` | `updateButton(id, formData)` | `title → label`, `url → url`, `icon → icon` |
| `removeLink(id)` | `deleteButton(id)` | `id → id` |
| *(no toggle in UI yet)* | `toggleButton(id, is_active)` | Not exposed in frontend |

**Current `saveLinks` frontend handler saves ALL links in one go.** The backend has individual CRUD actions. Strategy options:

**Option A (Recommended for MVP):** Keep the batch save but diff against current state and call individual actions:
```typescript
const saveLinks = async () => {
  // For each link:
  //  - if it's new (id starts with crypto.randomUUID format) → createButton
  //  - if it's modified → updateButton
  //  - deleted links → deleteButton (track removed links separately)
}
```

**Option B (Simpler):** Switch the UI to individual save-per-button model (like `ButtonManager.tsx` already does). Less UX polish but simpler wiring.

> [!WARNING]
> The frontend `saveLinks` currently attempts to save ALL links at once with no per-ID tracking of which ones are new vs. existing vs. deleted. This must be refactored before wiring. The current approach would create duplicates on every save.

### 3.4 Template Selection

**Frontend integration point:** `handleTemplateSelect(templateId: string)`

```typescript
// Backend action needed — DOES NOT EXIST YET
// Add to lib/actions/profile.ts:
export async function updateTemplate(templateKey: string) {
  const { user } = await requireActiveUser()
  const supabase = await createClient()
  const template_id = TEMPLATE_KEY_TO_ID[templateKey] ?? 1
  
  const { error } = await supabase
    .from('profiles').update({ template_id }).eq('id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}
```

```typescript
// Frontend wiring:
const handleTemplateSelect = async (templateId: string) => {
  setTemplateStatus({ state: 'saving', message: 'Aplicando plantilla...' })
  const res = await updateTemplate(templateId)  // ← new server action
  if (res?.error) {
    setTemplateStatus({ state: 'error', message: res.error })
  } else {
    setActiveTemplateId(templateId)
    setTemplateStatus({ state: 'success', message: 'Plantilla actualizada.' })
  }
}
```

### 3.5 Missing Server Actions Summary

| Action Needed | Exists | Notes |
|---|---|---|
| `updateProfile` | ✅ Yes | Missing `job_title` field — must add |
| `createButton` | ✅ Yes | Ready |
| `updateButton` | ✅ Yes | Ready |
| `deleteButton` | ✅ Yes | Ready |
| `toggleButton` | ✅ Yes | Not exposed in frontend yet |
| `updateTemplate` | 🔴 **Missing** | Must create |
| Cloudinary upload | ✅ Via client | Already working in `CloudinaryUploader.tsx` |
| `signOut` (logout) | 🔴 **Missing action** | Must wire `supabase.auth.signOut()` + router.refresh |

---

## 4. Route Compatibility

### 4.1 Route Inventory

| Route | Frontend | Backend | Middleware Rule |
|---|---|---|---|
| `/` | ✅ Landing page | ✅ Landing page | Public |
| `/login` | ✅ `(auth)/login/` | ✅ `(public)/login/` | Redirect to `/dashboard` if authed |
| `/signup` | ✅ `(auth)/signup/` | ✅ `(public)/register/` | Redirect to `/dashboard` if authed |
| `/dashboard` | ✅ `(dashboard)/page.tsx` | ✅ `(dashboard)/dashboard/page.tsx` | Requires active user |
| `/dashboard/profile` | ❌ Not in frontend | ✅ Backend only | Requires active user |
| `/dashboard/buttons` | ❌ Not in frontend | ✅ Backend only | Requires active user |
| `/[username]` | ✅ `[username]/page.tsx` | ✅ `(public)/[username]/` | Public |
| `/admin` | ❌ Not in frontend | ✅ Full admin panel | Requires admin role |
| `/inactive` | ❌ Not in frontend | ✅ Auto-redirect target | Public |
| `/nfc/[uid]` | ❌ Not in frontend | ✅ NFC redirect | Public |

### 4.2 Route Conflicts and Required Adjustments

> [!CAUTION]
> **Signup route name mismatch**: Frontend uses `/signup`, backend uses `/register`. The middleware checks `/login` and `/register`. Either:
> - Rename frontend auth route from `/signup` to `/register`, OR
> - Update middleware to also check `/signup`

> [!CAUTION]
> **Dual dashboard architectures**: The backend has `/app/(dashboard)/dashboard/` with sub-pages (`/profile`, `/buttons`). The frontend has a single SPA-style page at `/app/(dashboard)/page.tsx` with section-based routing. **These cannot both exist at the same path.** Decision required — see integration strategy §6.

> [!NOTE]
> Frontend `[username]` is at root level. Backend `[username]` is under `(public)` group. Both resolve to `/{username}` — no conflict.

### 4.3 Middleware Gaps

The current middleware checks `is_active` but **does NOT enforce `service_expires_at`**. An expired user with `is_active: true` passes through. Backend `requireActiveUser` also doesn't check expiration. This is a future risk but not a blocker for integration.

---

## 5. State Management Strategy

### 5.1 What Stays Client-Side

| State | Component | Why client |
|---|---|---|
| `activeSection` | `DashboardPage` | Navigation UX — no server round-trip needed |
| `profileForm` (local edits) | `DashboardPage` | Optimistic local editing before save |
| `links` (local edits) | `DashboardPage` | Batch edit model |
| `profileStatus`, `linksStatus`, `templateStatus` | `DashboardPage` | UI feedback only |
| `isUploading*` flags | `DashboardPage` | UI-only loading states |
| `editingId` | `ButtonManager` | UI-only editing mode |

### 5.2 What Must Come from Server

| Data | Source | How |
|---|---|---|
| Initial profile data | `requireActiveUser()` in Server Component | Prop-inject into `DashboardPage` |
| Initial buttons list | Supabase query in Server Component | Prop-inject into `DashboardPage` |
| Auth session / user identity | Supabase cookie session via middleware | Never in client props |
| User role | Backend only via `profile.role` | Never exposed in client UI |
| `is_active` status | Backend only | Never in client UI |

### 5.3 Revalidation Points

| Trigger | `revalidatePath()` call | Effect |
|---|---|---|
| Profile saved | `/dashboard/profile`, `/[username]` | Public card updates |
| Button CRUD | `/dashboard/buttons`, `/[username]` | Public card updates |
| Template changed | `/dashboard` (new action needed) | Dashboard refreshes |
| Admin changes user status | `/admin/users` | Admin list refreshes |

### 5.4 Dashboard Page Conversion Strategy

The `DashboardPage` in `/frontend` is currently `'use client'` with `MOCK_USER`. To integrate:

1. Convert the **parent** into an `async` Server Component that fetches real data
2. Move only the **interactive state** into a child `'use client'` component
3. Pass real profile + buttons as props instead of MOCK_USER

```tsx
// app/(dashboard)/dashboard/page.tsx  [INTEGRATED]
import { requireActiveUser } from '@/lib/auth/requireActiveUser'
import { createClient } from '@/lib/supabase/server'
import { dbProfileToUserProfile } from '@/lib/utils/adapters'
import { DashboardClient } from '@/frontend/app/(dashboard)/page'  // or moved component

export default async function DashboardPage() {
  const { profile } = await requireActiveUser()
  const supabase = await createClient()
  
  const { data: buttons } = await supabase
    .from('action_buttons')
    .select('*')
    .eq('profile_id', profile.id)
    .order('sort_order', { ascending: true })
  
  const userProfile = dbProfileToUserProfile(profile, buttons || [])
  
  return <DashboardClient initialProfile={userProfile} />
}
```

---

## 6. Risk Identification

### Critical Risks

| Risk | Severity | Details |
|---|---|---|
| `saveLinks` overwrites on every save | 🔴 Critical | Frontend saves all links at once with no diff—direct wiring would create duplicates. Must implement new vs. existing detection. |
| Template ID type mismatch | 🔴 Critical | `template_id` (int) vs `selectedTemplate` (string key). No lookup table exists. Integration will break without adapter. |
| `updateProfile` missing fields | 🟠 High | `job_title` and `company` are in the UI form but not in the server action. Saving will silently drop those fields. |
| `updateTemplate` server action missing | 🟠 High | Template selection in frontend calls a stubbed handler. No server action exists. Template changes won't persist. |
| Dual dashboard architectures | 🟠 High | Backend `/app/(dashboard)/` and frontend `/frontend/app/(dashboard)/` both need to merge into a single canonical dashboard. |
| Signup route name mismatch | 🟡 Medium | `/signup` (frontend) vs `/register` (backend/middleware). Auth redirect will fail for new users. |
| `signOut` not wired in frontend | 🟡 Medium | `onLogout={() => {}}` is empty. Sidebar logout button does nothing. |

### Edge Cases

| Scenario | Current State | Required Handling |
|---|---|---|
| Inactive user hits `/dashboard` | Middleware redirects to `/inactive` ✅ | `/inactive` page exists in backend, not in frontend — needs UI |
| Expired service (`service_expires_at` past) | Not enforced ⚠️ | Middleware and `requireActiveUser` don't check expiry |
| Admin accesses `/dashboard` | Middleware allows ✅ | Should still show dashboard (admin is also a user) |
| Non-admin accesses `/admin` | Middleware redirects to `/dashboard` ✅ | Correct |
| Username already taken on signup | Backend handles via Supabase `unique` constraint? | No uniqueness pre-check in `SignupForm` |
| Profile has `is_active: false` on public card | `notFound()` in backend ✅ | Frontend mock doesn't simulate this |

---

## 7. Step-by-Step Integration Strategy

### Phase 1 — Adapter Layer (No UI Changes)

- [ ] Create `lib/utils/template-map.ts` with int↔string lookup
- [ ] Create `lib/utils/adapters.ts` with `dbProfileToUserProfile()` and `dbButtonToLinkItem()`
- [ ] Add `job_title` and `company` to `updateProfile` server action
- [ ] Create `updateTemplate` server action in `lib/actions/profile.ts`

### Phase 2 — Auth Integration

- [ ] Replace `/app/(public)/login/page.tsx` with `LoginForm` component + real `onLogin` callback
- [ ] Replace `/app/(public)/register/page.tsx` with `SignupForm` component + real `onSignup` callback
- [ ] Rename frontend route `/signup` → `/register` (or update middleware to also match `/signup`)
- [ ] Wire logout: create `signOut` action or inline `supabase.auth.signOut()` + pass to `onLogout` sidebar prop

### Phase 3 — Dashboard Integration

- [ ] Convert `frontend/app/(dashboard)/page.tsx` into a `DashboardClient` component (pure client, receives `initialProfile` prop)
- [ ] Create/update `app/(dashboard)/dashboard/page.tsx` as a Server Component that calls `requireActiveUser`, fetches buttons, runs adapter, and renders `DashboardClient`
- [ ] Remove old `ProfileEditor`, `ButtonManager` scaffold pages (or keep as fallback sub-routes)

### Phase 4 — Action Wiring

- [ ] Wire `handleProfileSave` → `updateProfile(formData)` with field name mapping
- [ ] Wire Cloudinary upload → pass `cloudinaryUpload` helper as `onUpload` callback to `handleImageUpload`
- [ ] Redesign `saveLinks` to track new, modified, and deleted buttons individually and call the correct action for each
- [ ] Wire `handleTemplateSelect` → `updateTemplate(templateKey)` (new action)
- [ ] Wire `onLogout` → `supabase.auth.signOut()` + `router.push('/')` + `router.refresh()`

### Phase 5 — Public Card Integration

- [ ] Replace `MOCK_PUBLIC_PROFILE` in `frontend/app/[username]/page.tsx` with real Supabase fetch
- [ ] Use `dbProfileToUserProfile()` adapter to map DB row to `UserProfile`
- [ ] Pass mapped profile to `LinktreeCard` (it already accepts `UserProfile` — zero changes needed)
- [ ] Decision: replace `TemplateOne.tsx` (bare backend component) with `LinktreeCard` (rich frontend component) for the production render

### Phase 6 — QA Checklist

- [ ] Login → dashboard redirect works correctly
- [ ] Admin login → admin redirect works correctly  
- [ ] Inactive user → `/inactive` redirect works
- [ ] Profile save persists to Supabase and public card updates
- [ ] Image upload writes Cloudinary URL and saves correctly
- [ ] Button add/edit/delete reflects on public card
- [ ] Template selection persists and public card reflects it
- [ ] Logout clears session and redirects to login
- [ ] Public `/[username]` shows `notFound` for inactive profiles

---

## Appendix: File Change Summary

| File | Action |
|---|---|
| `lib/utils/template-map.ts` | 🟢 Create |
| `lib/utils/adapters.ts` | 🟢 Create |
| `lib/actions/profile.ts` | 🟡 Modify — add `job_title`, `company` fields + `updateTemplate` action |
| `app/(public)/login/page.tsx` | 🟡 Replace UI with `LoginForm` + wired callback |
| `app/(public)/register/page.tsx` | 🟡 Replace UI with `SignupForm` + wired callback |
| `frontend/app/(auth)/signup/` | 🟡 Rename to `signup` OR update middleware |
| `app/(dashboard)/dashboard/page.tsx` | 🟡 Convert to Server Component → renders `DashboardClient` |
| `frontend/app/(dashboard)/page.tsx` | 🟡 Extract as `DashboardClient`, add `initialProfile` prop |
| `frontend/app/[username]/page.tsx` | 🟡 Replace mock with real Supabase fetch + adapter |
| `app/(public)/[username]/page.tsx` | 🟡 Optionally swap `TemplateOne` for `LinktreeCard` |
| `middleware.ts` / `lib/supabase/middleware.ts` | 🟡 Add `/signup` to auth route check if not renaming |
