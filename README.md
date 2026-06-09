# SATI Alumni Portal — Frontend

A full-stack college networking platform for **Samrat Ashok Technological Institute (SATI), Vidisha**. It connects students and alumni for job opportunities, events, real-time messaging, and professional networking. Built with **React + Vite** on the frontend and a **Spring Boot** backend.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Entry Points](#entry-points)
5. [App Shell & Routing — `App.jsx`](#app-shell--routing--appjsx)
6. [Authentication — `AuthContext.jsx`](#authentication--authcontextjsx)
7. [API Layer — `api.js`](#api-layer--apijs)
8. [Pages](#pages)
   - [Login](#login)
   - [Register](#register)
   - [JobListings & JobDetails](#joblistings--jobdetails)
   - [MyApplications](#myapplications)
   - [ConnectionsPage](#connectionspage)
   - [SharedPages / Sharedpages_](#sharedpages--sharedpages_)
9. [Components](#components)
   - [Navbar](#navbar)
   - [Footer](#footer)
   - [ChatBox (AI Assistant)](#chatbox-ai-assistant)
   - [ProtectedRoute](#protectedroute)
10. [Styling System](#styling-system)
11. [Real-Time & WebSocket Features](#real-time--websocket-features)
12. [Smooth Scroll — Lenis + GSAP](#smooth-scroll--lenis--gsap)
13. [Key Design Patterns & Bug Fixes](#key-design-patterns--bug-fixes)
14. [Environment Variables](#environment-variables)
15. [Running the Project](#running-the-project)

---

## Project Overview

The SATI Alumni Portal has two user roles:

| Role | Access |
|---|---|
| **STUDENT** | Browse & apply to jobs, register for events, connect with alumni, real-time messaging, AI career assistant |
| **RECRUITER / Alumni** | Post jobs, create events, manage applications, messaging with students |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Routing | React Router v6 |
| HTTP Client | Axios (with interceptors) |
| Animation | GSAP + ScrollTrigger |
| Smooth Scroll | Lenis |
| Notifications | react-hot-toast |
| Styling | CSS custom properties (no Tailwind in core pages; Register page uses Tailwind classes) |
| Real-time | WebSocket (STOMP) |
| Auth | JWT — stored in `localStorage`, parsed client-side for display only |

---

## Project Structure

```
src/
├── context/
│   └── AuthContext.jsx        # Global auth state, JWT parsing, login/logout
├── pages/
│   ├── About.jsx              # Landing / about page
│   ├── Login.jsx              # Login form
│   ├── Register.jsx           # Registration form with resume upload
│   ├── JobListings.jsx        # Browse all jobs
│   ├── JobDetails.jsx         # Single job detail + apply
│   ├── MyApplications.jsx     # Student's application tracker
│   ├── Events.jsx             # Browse & register for events
│   ├── MyProfile.jsx          # User profile editor
│   ├── ConnectPage.jsx        # Find & send connection requests
│   ├── ConnectionsPage.jsx    # Chat list of accepted connections
│   ├── ChatPage.jsx           # Real-time 1-on-1 chat
│   ├── NotificationsPage.jsx  # Connection requests + notifications
│   ├── RecruiterDashboard.jsx # Recruiter's job + event management
│   └── SharedPages.jsx        # Placeholder pages (Connected, Requests, MyJobs, MyEvents)
├── components/
│   ├── Navbar.jsx             # Top navigation bar
│   ├── Footer.jsx             # Site footer with navigation + social links
│   ├── ChatBox.jsx            # Floating AI career assistant widget
│   └── ProtectedRoute.jsx     # Auth guard wrapper
├── services/
│   └── api.js                 # All Axios API calls + request/response interceptors
├── App.jsx                    # Root layout, routing, Lenis setup, page transitions
├── main.jsx                   # React DOM entry point
├── index.css                  # Global CSS custom properties + utility classes
└── Footer.css                 # Footer/chat responsive overrides
```

---

## Entry Points

### `main.jsx`
The absolute root of the React app.

```
ReactDOM.createRoot → React.StrictMode → AuthProvider → App
```

- Mounts the React tree into `#root` in `index.html`.
- Wraps everything in `<AuthProvider>` so every component in the tree has access to the logged-in user via `useAuth()`.
- Imports `index.css` globally so CSS custom properties are available everywhere.

---

## App Shell & Routing — `App.jsx`

This file is responsible for four things: **global layout**, **routing**, **animations**, and **Lenis smooth scroll**.

### Lenis Smooth Scroll Setup

```js
let lenisInstance = null; // module-level singleton

function createLenis() {
  if (lenisInstance) return lenisInstance; // prevent duplicate instances
  const lenis = new Lenis({ duration: 1.1, smoothWheel: true, ... });
  gsap.ticker.add((time) => lenis.raf(time * 1000)); // drives Lenis via GSAP's RAF
  lenis.on("scroll", ScrollTrigger.update);          // keeps ScrollTrigger in sync
  window.__lenis__ = lenis;                          // exposed globally for Footer + ChatBox
  return lenis;
}
```

Lenis is a singleton. It is created once inside `<Layout>` via `useEffect`. Exposing it on `window.__lenis__` lets the `Footer` and `ChatBox` call `lenis.scrollTo(0)` without prop-drilling.

The `prevent` option tells Lenis to leave elements with `data-lenis-prevent` alone — this is how the `ChatBox` scroll area works independently.

### `ParticleBackground`

A `<canvas>` element rendered behind everything. Draws 18 slowly drifting indigo dots. Uses `requestAnimationFrame` directly (not Lenis/GSAP) since it doesn't need scroll synchronisation. Cleans up the RAF on unmount.

### `ScrollProgressBar`

A thin bar at the top of the viewport. Every 16 ms it reads `lenisInstance.progress` (0 → 1) and sets `scaleX` on the bar element — a pure CSS transform, no layout cost.

### `AnimatedPage`

Every route change triggers:
1. Scroll reset to top (via Lenis if available, otherwise `window.scrollTo`).
2. `ScrollTrigger.refresh()` so any scroll-triggered animations recalculate their positions.
3. A GSAP fade-in: `opacity: 0, y: 14` → `opacity: 1, y: 0` over 0.45s.

Uses `gsap.context()` so all animations are scoped and properly reverted on unmount to prevent memory leaks.

### `DashboardRedirect`

A helper route component that reads the user's role and sends them to `/recruiter` or `/jobs`. Renders nothing while auth is loading to prevent a flash redirect.

### `Layout` — the two layouts

The app has **two distinct layouts**:

**Chat layout** (`/chat/:otherId`):
- `height: 100dvh`, `overflow: hidden` — prevents the page from being taller than the viewport, which is required for a fixed-height chat UI.
- No `<Footer>`, no `<ChatBox>` FAB, no `<AnimatedPage>` wrapper.
- Only renders the single chat route.

**Standard layout** (everything else):
- `minHeight: 100vh`, flex column so the footer always sticks to the bottom.
- Conditionally hides `<Navbar>` on `/login`, `/register`, `/about`.
- Renders `<Footer>` and `<ChatBox>` (the AI assistant FAB) on all other pages.

### Route Map

| Path | Component | Protected |
|---|---|---|
| `/` | Redirects to `/about` | No |
| `/about` | `About` | No |
| `/login` | `Login` | No |
| `/register` | `Register` | No |
| `/jobs` | `JobListings` | Yes |
| `/jobs/:id` | `JobDetails` | Yes |
| `/my-applications` | `MyApplications` | Yes |
| `/profile` | `MyProfile` | Yes |
| `/events` | `Events` | Yes |
| `/recruiter` | `RecruiterDashboard` | Yes |
| `/dashboard` | `DashboardRedirect` | Yes |
| `/connect` | `ConnectPage` | Yes |
| `/notifications` | `NotificationsPage` | Yes |
| `/connected` | `ConnectionsPage` | Yes |
| `/chat/:otherId` | `ChatPage` | Yes |
| `/chat` | Redirects to `/jobs` | No |
| `*` | Redirects to `/about` | No |

---

## Authentication — `AuthContext.jsx`

Provides a global `{ user, login, logout, loading }` context.

### State shape

```js
user = {
  token: "eyJ...",   // JWT string
  name:  "Prachi",
  role:  "STUDENT",  // always normalised — ROLE_ prefix stripped
  id:    "42"        // always a string
}
```

### JWT ID parsing — `parseIdFromJwt(token)`

Spring Boot JWTs typically put the username/email in the `sub` claim, **not** the numeric database ID. This function:

1. Base64url-decodes the JWT payload (middle segment).
2. Looks for an explicit `id` or `userId` claim first.
3. Falls back to `sub` **only if** it looks purely numeric (digits only).
4. If `sub` is an email, logs a warning telling the developer to add an explicit `id` claim in the Spring Boot JWT filter.

This prevents a bug where `user.id` would be set to `"prachi@gmail.com"` and every API call to `/api/users/prachi@gmail.com` would 404.

### `normalizeRole(role)`

Strips the `ROLE_` prefix that Spring Security adds. So `"ROLE_RECRUITER"` becomes `"RECRUITER"`. This ensures role checks like `user.role === "RECRUITER"` work everywhere.

### Hydration on cold start

When the page loads (or refreshes), `useState` initialiser re-reads `localStorage`:
- If `id` is the literal string `"null"` or `"undefined"` (can happen if the backend didn't return it), it falls back to `parseIdFromJwt`.
- After resolving, it writes the correct ID back to `localStorage` so future cold-starts don't repeat the JWT parsing.

### `login(data)` and `logout()`

`login` accepts the backend's login response, resolves the ID via the same fallback chain, and persists everything to `localStorage`. `logout` clears all four keys and sets `user` to `null`.

---

## API Layer — `api.js`

A configured Axios instance that handles auth, logging, and error recovery.

### Base URL

```js
baseURL: import.meta.env.VITE_API_URL
```

Set in `.env` / `.env.production`. All relative paths in the export functions resolve against this.

### `isTokenExpired()`

Decodes the JWT payload and compares `exp * 1000` (milliseconds) against `Date.now() + 30_000`. The 30-second skew prevents edge cases where the token expires mid-request.

### Request Interceptor

Runs before every outgoing request:
- Reads the token from `localStorage` and adds `Authorization: Bearer <token>`.
- In development mode, logs the method, URL, and whether a token was attached.

### Response Interceptor

Runs on every response (or error):
- On **401 Unauthorized** (and only 401, not 403 or other errors):
  - Saves the current path to `localStorage` as `redirectAfterLogin` so the user is sent back after re-logging in.
  - Clears all auth keys from `localStorage`.
  - Hard-redirects to `/login`.
- Requests with `{ skipAuthRedirect: true }` in their config are excluded from this redirect (used for connection/notification APIs that poll frequently and should silently fail rather than kicking the user out).

### API Functions by Domain

**Auth**
- `registerUser(data)` — POST `/auth/register`
- `loginUser(data)` — POST `/auth/login`

**Jobs**
- `getJobs()` — all jobs
- `getJobsByRecruiter(recruiterId)` — with 404/405 fallback to `/api/jobs/recruiter/:id`
- `createJob(data)` — with same 404/405 fallback
- `deleteJob(id)`, `searchJobs(title)`, `getJobById(id)`

**Applications**
- `applyForJob(data)` — POST `/api/applications`
- `getMyApplications(userId)`, `getAllApplications()`, `getApplicationsByJob(jobId)`
- `updateApplicationStatus(id, status)`

**AI Chat**
- `sendMessage(message)` — POST `/chat`

**User Profile**
- `getUserById(id)`, `updateUserProfile(id, data)`
- `uploadResume(id, file)` — multipart/form-data POST
- `downloadResume(id)` — response type `blob` for file download

**Events**
- `createEvent`, `getAllEvents`, `getEventsByRecruiter`, `getEventById`, `deleteEvent`
- `registerForEvent(eventId, userId)`, `getEventApplications`, `getUserEventApplications`
- `updateEventApplicationStatus`

**Connections**
- `getAllUsers()` — for ConnectPage's "find people" list
- `sendConnectionRequest(senderId, receiverId)` — sends numbers (not strings) to backend
- `getConnectionRequests(userId)`, `getSentRequests(userId)` — both `skipAuthRedirect: true`
- `updateConnectionRequest(id, status)` — accept / reject
- `getConnections(userId)` — accepted connections list

**Messaging**
- `sendMsg(data)`, `getConversation(user1, user2)`, `markMessagesRead(senderId, receiverId)`
- `getUnreadCount(userId)`, `deleteConversation(userId, otherId)`, `removeConnection(userId, otherId)`

**Presence**
- `getUserPresence(userId)` — returns `{ isOnline, lastSeenAt }`

**Notifications**
- `getNotifications(userId)`, `getNotificationUnreadCount(userId)`
- `markAllNotificationsRead(userId)`, `markOneNotificationRead(notificationId)`

---

## Pages

### Login

`Login.jsx` — a clean single-card login form.

**State:** `form` (email + password), `loading`, `showPassword`.

**Flow:**
1. Validates both fields are non-empty.
2. Calls `loginUser(form)` via the API layer.
3. Passes the response to `login(data)` in `AuthContext`.
4. Reads `redirectAfterLogin` from `localStorage` — if present, navigates there and removes the key (one-time use). This is the mechanism that returns users to `/notifications` if a 401 kicked them out mid-action.
5. Falls back to `/recruiter` or `/jobs` based on role.

**Password toggle:** An eye/eye-off SVG icon button toggles `type="password"` ↔ `type="text"`.

### Register

`Register.jsx` — registration form with role selection and optional resume upload.

**State:** `form` (name, email, password, role), `resume` file, `loading`, `showPassword`, `error`.

**Flow:**
1. Calls `registerUser(form)`.
2. If `STUDENT` and a resume file was selected, calls `uploadResume(userId, file)`.
3. Immediately calls `loginUser` to auto-login after registration.
4. Normalises the role (strips `ROLE_` prefix) and navigates to the correct dashboard.

**Resume upload:** Uses a drag-and-drop styled `<input type="file">` (hidden, triggered by a label). Client-side validates file size ≤ 5 MB. Accepts `.pdf`, `.doc`, `.docx`.

**Role selector:** Two styled toggle buttons (STUDENT / RECRUITER). Clicking one sets `form.role` — no radio inputs used.

Note: This page uses Tailwind CSS classes (`className="..."`) rather than the CSS variable system used elsewhere, reflecting an earlier implementation style.

### JobListings & JobDetails

`JobListings.jsx` — paginated/searchable list of all job postings.

`JobDetails.jsx` — detail view for a single job.

**State:** `job`, `loading`, `applying`, `applied`.

**Flow:**
1. Reads `:id` from route params via `useParams`.
2. Fetches the job via `getJobById(id)`.
3. **Apply button:** Calls `applyForJob({ userId: user.id, jobId: job.id })`. On success, sets `applied = true` and the button changes to "✓ Applied" and becomes permanently disabled for the session.

**Layout:** Three cards stacked vertically — job header (title, company, location, salary, apply button), description, requirements. All sections handle missing data gracefully (`|| 'No description provided.'`).

### MyApplications

`MyApplications.jsx` — the student's personal application tracker.

**State:** `applications[]`, `jobMap{}` (id → job), `loading`, `error`.

**Data loading:** Fires two API calls in parallel via `Promise.all`:
- `getMyApplications(user.id)` for the student's applications.
- `getJobs()` for all jobs.

Jobs are stored in an object map keyed by `job.id` for O(1) lookup — avoids calling `Array.find()` on every render for each application row.

**Guard:** Validates `user.id` is not `null` or `"undefined"` before making the API call. If invalid, shows a "please sign in again" message.

**Stat cards:** Four summary tiles — Total Applied, Accepted, Pending, Rejected — each with an icon and a count.

**Application rows:** Each row shows:
- A coloured avatar circle using the company's first letter.
- Job title (fallback: `Job #<id> (removed)` for deleted jobs).
- Company name, location, salary.
- A status badge: `APPLIED` (indigo), `ACCEPTED` (green), `REJECTED` (red).

**Skeleton loading:** Dedicated `<SkeletonStatCard>` and `<SkeletonAppCard>` components render placeholder shimmer blocks while data loads.

### ConnectionsPage

`ConnectionsPage.jsx` — the messaging inbox. Lists all accepted connections and navigates to their chat.

**State:** `connections[]`, `filtered[]`, `loading`, `search`, `unreadMap{}`.

**Data sources:**
- `getConnections(user.id)` — loads accepted connections.
- Listens to a custom DOM event `"connectionStateUpdated"` so that if a connection is accepted on the `NotificationsPage`, this list refreshes automatically without a page reload.
- Also re-fetches on every `location.pathname` change.

**Search:** Client-side filter across `name`, `company`, and `skills` fields (case-insensitive).

**Avatar colours:** A deterministic colour picker maps the first character code of a name to one of five palette entries. Same name always gets the same colour, no randomness.

**`formatConnectedTime(dt)`:** Smart timestamp formatter:
- Same day → `"2:30 PM"`
- Yesterday → `"Yesterday"`
- Older → `"12 Jun"` (short date)

**Each row** shows: coloured letter avatar (with unread badge overlay if `unreadMap[userId] > 0`), name, role metadata, connected-at timestamp, and a right chevron. Clicking navigates to `/chat/:userId`.

**Empty states:** Two distinct messages — "No connections yet" (with a "Find People" button) vs "No matches found" (search returned nothing).

### SharedPages / Sharedpages_

`SharedPages.jsx` — four placeholder page components (`Connected`, `Requests`, `MyJobs`, `MyEvents`) used while those features are under development. Each renders a centered "coming soon" card with Tailwind classes.

`Sharedpages_.jsx` — a minimal one-liner version of the same four components (bare `<div>` with padding). Acts as a quick stub for import compatibility.

---

## Components

### Navbar

`Navbar.jsx` — the sticky top navigation bar.

Reads `user` from `AuthContext` to show role-appropriate links. Has a notification badge that polls `getNotificationUnreadCount`. Includes a button that dispatches the `"open-chatbox"` custom DOM event to open the `ChatBox` without prop-drilling.

### Footer

`Footer.jsx` — the site footer. Hidden on `/about`, `/login`, `/register`.

**Three-column grid:** Brand description + college link | Navigation links | Social links + contact.

**`scrollToTop()`:** A custom function that uses `window.__lenis__` if available (for Lenis-managed pages) and falls back to `window.scrollTo({ behavior: "instant" })` otherwise. Called after every footer nav link click with a `setTimeout(0)` to let React Router finish mounting the new page first.

**Social links:** GitHub and LinkedIn. Hover state changes colour and border (LinkedIn → `#0A66C2`, GitHub → text primary).

**Bottom bar:** Copyright year (computed with `new Date().getFullYear()`) and a tagline.

### ChatBox (AI Assistant)

`ChatBox.jsx` — a floating chat widget powered by the backend's AI endpoint.

**Visibility:** Only renders if `user` is logged in. Returns `null` otherwise — no empty DOM nodes.

**FAB button:** Fixed position, bottom-right. Toggles the chat window open/closed. Uses a chat bubble icon when closed, an × icon when open.

**Event-driven open:** Listens for the `"open-chatbox"` DOM event dispatched by the Navbar. If the user isn't logged in yet when the event fires (auth is still initialising), it sets `pendingOpen = true`. A second `useEffect` watches for `user` to become available and then opens the chat.

**Scroll trap fix:** The chat body has a `wheel` and `touchmove` event listener that:
- Calls `e.stopPropagation()` always — prevents Lenis from intercepting scroll events inside the chat.
- Calls `e.preventDefault()` only at the top/bottom boundary — prevents page scroll bleed-through.
- Uses `{ passive: false }` to allow `preventDefault`.
- The element also has `data-lenis-prevent` as a declarative backup.

**Message handling:** On send, appends the user message immediately (optimistic UI), then awaits the API. The response parser tries multiple possible field names from the backend (`reply`, `message`, `response`, `answer`, `text`) before falling back to a raw string parse. Error messages are status-code-aware (401, 404, 500+).

**`TypingDots`:** Three dots with staggered CSS `@keyframes typingBounce` animation shown while awaiting the bot response.

**All styles** are defined as a `styles` object (inline style references) rather than CSS classes, keeping the component self-contained.

### ProtectedRoute

`ProtectedRoute.jsx` — a route guard wrapper.

```jsx
if (loading) return <p>Loading...</p>; // wait for AuthContext to hydrate
return user ? children : <Navigate to="/login" />;
```

The `loading` check is critical. Without it, `user` is `null` for a brief moment on every page refresh (before `localStorage` is read), which would cause an immediate redirect to `/login` even for logged-in users.

---

## Styling System

All colours, spacing, shadows, and font stacks are defined as CSS custom properties in `index.css`. This enables easy theming and consistent values across all inline styles.

Key variables include:

```css
--primary          /* Deep Indigo #4F46E5 */
--primary-dim      /* Faded indigo for badge backgrounds */
--bg               /* Page background */
--bg-surface       /* Card / panel background */
--bg-subtle        /* Input / hover background */
--border           /* Default border colour */
--text-primary
--text-secondary
--text-muted
--text-xmuted
--font-display     /* Playfair Display — headings */
--font-body        /* Inter — body text */
--success          /* Green */
--success-bg
--success-border
--error            /* Red */
--error-bg
--error-border
--shadow-sm / --shadow-md / --shadow-xl
--r-md / --r-lg / --r-xl  /* border-radius scale */
```

`Footer.css` adds two mobile overrides for the chat window and FAB positioning on screens under 600px wide.

---

## Real-Time & WebSocket Features

The `ChatPage.jsx` implements real-time messaging using a WebSocket connection (STOMP over SockJS). The key behaviours:

- Messages are sent via WebSocket and also persisted via `sendMsg()` REST call for reliability.
- `getConversation(user1, user2)` loads history on mount.
- `markMessagesRead` is called when the chat window is opened or when new messages arrive.
- Presence (online/offline status + last seen) is fetched via `getUserPresence(userId)`.
- The chat layout bypasses `AnimatedPage` and uses `height: 100dvh` to prevent the message list from overflowing the viewport.

---

## Smooth Scroll — Lenis + GSAP

The scroll system involves three interacting pieces:

| Piece | Role |
|---|---|
| **Lenis** | Replaces native scroll with interpolated smooth scroll |
| **GSAP ticker** | Drives Lenis's `raf()` on every animation frame |
| **ScrollTrigger** | GSAP plugin for scroll-triggered animations; kept in sync via `lenis.on("scroll", ScrollTrigger.update)` |

**Why `window.__lenis__`?** Lenis is instantiated inside `<Layout>` which is a React component. `Footer.jsx` and `ChatBox.jsx` are sibling components with no shared React state. Rather than prop-drilling `lenisInstance` through the tree or using a context, it is attached to `window` as `__lenis__` — a documented pattern for Lenis integration.

**`data-lenis-prevent`:** Any element with this attribute is excluded from Lenis interception. Applied to the `ChatBox` message list so that scrolling within the chat bubble doesn't cause the page to scroll.

---

## Key Design Patterns & Bug Fixes

### `redirectAfterLogin` pattern
When the response interceptor catches a 401, it writes `window.location.pathname` to `localStorage` as `"redirectAfterLogin"`. After the user re-authenticates in `Login.jsx`, this value is read, the user is sent back to where they were, and the key is deleted. This is important for the `NotificationsPage` which has a "pending action replay" feature — if a user clicks "Accept" on a connection request, gets 401'd, logs back in, and is returned to `/notifications`, the page replays the pending action automatically.

### `skipAuthRedirect: true`
Connection, notification, and presence APIs are called on timers or from pages that poll frequently. If any of these silently returns 401 (e.g. token just expired), it should not immediately kick the user to `/login`. These calls pass `skipAuthRedirect: true` in the Axios config to opt out of the interceptor's redirect logic.

### Deterministic avatar colours
Both `ConnectionsPage` and `MyApplications` use the same pattern:
```js
COLORS[(name.charCodeAt(0) || 0) % COLORS.length]
```
This maps a name to a consistent colour without storing any state.

### O(1) job lookup in `MyApplications`
Instead of calling `jobs.find(j => j.id === app.jobId)` inside the render loop (O(n) per application per render), jobs are pre-processed into a plain object map `{ [job.id]: job }` and lookup is `jobMap[app.jobId]` — O(1).

### Chat route isolation
The `/chat/:otherId` route is detected **before** the route tree is rendered. It gets a completely separate layout branch with no footer, no ChatBox, no AnimatedPage. This prevents the smooth-scroll wrapper from interfering with the fixed-height chat UI.

### GSAP context cleanup
All GSAP animations inside `AnimatedPage` are created inside `gsap.context()` and cleaned up with `ctx.revert()` on unmount. This prevents stale animation state from persisting across route changes.

---

## Environment Variables

Create a `.env` file at the project root:

```env
VITE_API_URL=http://localhost:8080
```

For production deployment (e.g. AWS EC2):

```env
VITE_API_URL=http://<your-ec2-ip>:8080
```

All API calls use this base URL. The variable is accessed via `import.meta.env.VITE_API_URL` (Vite's env variable convention — must be prefixed with `VITE_`).

---

## Running the Project

### Prerequisites
- Node.js 18+
- The Spring Boot backend running (default port 8080)

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm run dev
```

Runs on `http://localhost:5173` by default.

### Build for production

```bash
npm run build
```

Output goes to the `dist/` folder. Deploy to any static host (Vercel, Netlify, Nginx, etc.).

### Preview production build locally

```bash
npm run preview
```

---

## Notes on the Dual Styling Approach

The codebase uses two styling approaches. Most pages (Login, ConnectionsPage, MyApplications, JobDetails, Footer, ChatBox) use **inline styles with CSS custom properties** — all layout and colour values reference `var(--primary)` etc. defined in `index.css`.

The `Register.jsx` page uses **Tailwind CSS class names** (`className="..."`) — this is an older part of the codebase from before the design system was standardised. Both approaches work because Tailwind's utility classes are independently compiled.

If you are adding new pages, use the CSS custom properties / inline style approach to stay consistent with the majority of the codebase.