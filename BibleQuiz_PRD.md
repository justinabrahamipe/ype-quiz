# BibleQuiz — Church Bible Quiz Platform
### Product Requirements Document for Claude Code
**Mahanaimype Church | March 2026**

---

## 1. Tech Stack

| Item | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Deployment | Vercel |
| Database | NeonDB (Postgres) via Drizzle ORM |
| Auth | NextAuth.js v5 — Google OAuth only |
| Styling | Tailwind CSS |
| Language | TypeScript throughout |
| Fuzzy Matching | `fastest-levenshtein` (server-side) |
| Admin Email | `mahanaimype@gmail.com` (hardcoded super-admin) |

---

## 2. Environment Variables

Create a `.env.local` file:

```
DATABASE_URL=             # NeonDB connection string
NEXTAUTH_SECRET=          # Random secret string
NEXTAUTH_URL=             # e.g. https://yourapp.vercel.app
GOOGLE_CLIENT_ID=         # From Google Cloud Console
GOOGLE_CLIENT_SECRET=     # From Google Cloud Console
```

> In Google Cloud Console, enable the Google+ API and add your Vercel URL and `http://localhost:3000` as authorised redirect URIs.

---

## 3. Database Schema

Use Drizzle ORM. Create the following tables in NeonDB.

### 3.1 users

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| email | text UNIQUE NOT NULL | from Google OAuth |
| name | text | from Google profile |
| image | text | profile picture URL |
| role | text DEFAULT 'user' | `'user'` or `'admin'` |
| created_at | timestamp | account creation time |

### 3.2 quizzes

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| title | text NOT NULL | e.g. "Genesis 1–10 Quiz" |
| bible_portion | text NOT NULL | e.g. "Book of Genesis, Chapters 1–10" |
| start_time | timestamp NOT NULL | 12:00 noon on chosen start date |
| end_time | timestamp NOT NULL | 23:59 the next day after start |
| question_count | int NOT NULL | admin sets this |
| created_by | uuid FK → users.id | which admin created it |
| created_at | timestamp | |

### 3.3 questions

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| quiz_id | uuid FK → quizzes.id | |
| question_text | text NOT NULL | in English |
| answer_type | text NOT NULL | `'text'` or `'number'` |
| accepted_answers | text[] NOT NULL | array of accepted correct answers |
| order_index | int NOT NULL | display order |

**Notes on `accepted_answers`:**
- Admin can enter multiple accepted answers per question
- For `text` type: any one matching at 70%+ fuzzy similarity = correct
- For `number` type: any one matching exactly = correct
- Stored as a Postgres text array

### 3.4 attempts

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| quiz_id | uuid FK → quizzes.id | |
| user_id | uuid FK → users.id | |
| started_at | timestamp | when user first opened the quiz |
| completed_at | timestamp | when user submitted last question |
| raw_score | decimal | correct answer count (calculated after window closes) |
| bonus_points | decimal DEFAULT 0 | +0.5 if early finisher with 50%+ |
| is_complete | boolean DEFAULT false | true when all questions answered |
| UNIQUE | (quiz_id, user_id) | one attempt per user per quiz |

> **Important:** `raw_score` and `bonus_points` are NOT calculated at submission time. They are calculated only after the quiz window closes at 23:59. This prevents score leakage during the active window.

### 3.5 answers

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| attempt_id | uuid FK → attempts.id | |
| question_id | uuid FK → questions.id | |
| submitted_text | text | exactly what the user typed |
| is_correct | boolean | NULL until quiz window closes |
| answered_at | timestamp | when answer was submitted |
| time_taken_seconds | int | seconds used out of 120 |

> `is_correct` stays NULL during the active quiz window. A background job sets it after the window closes.

### 3.6 disputes

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| answer_id | uuid FK → answers.id | which answer is disputed |
| user_id | uuid FK → users.id | who raised the dispute |
| comment | text NOT NULL | user's explanation |
| status | text DEFAULT 'pending' | `'pending'`, `'approved'`, `'rejected'` |
| admin_note | text | admin's response |
| resolved_by | uuid FK → users.id | which admin resolved it |
| created_at | timestamp | |
| resolved_at | timestamp | |

> Disputes can only be raised **after** the quiz window closes (when correct answers are revealed).

### 3.7 overall_scores (cached table)

| Column | Type | Notes |
|---|---|---|
| user_id | uuid PK FK → users.id | |
| total_score | decimal DEFAULT 0 | floored at 0, never negative |
| quizzes_attempted | int DEFAULT 0 | |
| quizzes_missed | int DEFAULT 0 | |
| last_updated | timestamp | |

> Recomputed after each quiz window closes and after each dispute resolution.

---

## 4. Folder Structure

```
app/
  (auth)/
    login/page.tsx                  # Google sign-in page
  (user)/
    page.tsx                        # Home — leaderboard + active quiz
    quiz/[id]/page.tsx              # Active quiz attempt page
    quiz/[id]/submitted/page.tsx    # Post-submission holding page
    quiz/[id]/results/page.tsx      # Results (visible after window closes)
    quiz/[id]/review/page.tsx       # Past quiz review (read-only)
  (admin)/
    admin/page.tsx                  # Admin dashboard
    admin/quizzes/new/page.tsx      # Create quiz
    admin/quizzes/[id]/page.tsx     # Edit quiz / view submissions
    admin/quizzes/[id]/disputes/page.tsx  # Manage disputes for a quiz
    admin/users/page.tsx            # Manage admin users

api/
  auth/[...nextauth]/route.ts       # NextAuth handler
  quiz/[id]/start/route.ts          # Start attempt
  quiz/[id]/answer/route.ts         # Submit single answer
  quiz/[id]/complete/route.ts       # Mark attempt complete
  leaderboard/route.ts              # Overall + per-quiz scores
  disputes/route.ts                 # Raise a dispute
  admin/quiz/route.ts               # Create / update quiz
  admin/disputes/[id]/route.ts      # Approve / reject dispute
  admin/users/route.ts              # Promote / demote admin
  cron/process-quiz-results/route.ts  # Triggered after window closes
  cron/process-penalties/route.ts   # Nightly missed-quiz penalties

lib/
  db/
    schema.ts                       # Drizzle schema
    index.ts                        # NeonDB connection
  auth.ts                           # NextAuth config
  scoring.ts                        # All scoring logic
  answer-matcher.ts                 # Fuzzy matching logic
```

---

## 5. Authentication

- Google OAuth only via NextAuth.js v5 — no email/password login
- On first login, create a row in the `users` table
- If email === `mahanaimype@gmail.com` → automatically set `role = 'admin'`
- Store `role` in the NextAuth session JWT so it is available client-side
- Protect all `/admin` routes with Next.js middleware — redirect non-admins to home
- Protect all quiz routes — redirect unauthenticated users to `/login`

### Session shape

```ts
session.user.id       // uuid from users table
session.user.email    // Google email
session.user.name     // Google display name
session.user.image    // Google profile picture
session.user.role     // 'user' | 'admin'
```

---

## 6. Answer Matching Logic

Implemented in `lib/answer-matcher.ts`. Called server-side only, never exposed to the client.

### Text answers

```
function normalise(str):
  1. Lowercase
  2. Trim whitespace
  3. Strip leading/trailing articles: remove "a ", "an ", "the " from start
  4. Remove all extra spaces

function isCorrect(submitted, acceptedAnswers, type):
  if type === 'number':
    return acceptedAnswers.some(a => submitted.trim() === a.trim())
  
  if type === 'text':
    normSubmitted = normalise(submitted)
    return acceptedAnswers.some(accepted => {
      normAccepted = normalise(accepted)
      similarity = levenshteinSimilarity(normSubmitted, normAccepted)
      return similarity >= 0.70
    })
```

### Levenshtein similarity

```
similarity = 1 - (editDistance / Math.max(str1.length, str2.length))
```

### Number answers

- Exact match only after trimming whitespace
- "600" must be "600" — no fuzzy matching
- Admin can enter multiple accepted numbers (e.g. "40" and "forty" as separate entries)

### Examples

| Correct answer | Submitted | Result |
|---|---|---|
| Noah | noah | ✅ correct (case) |
| Noah | Noahh | ✅ correct (fuzzy ~91%) |
| The Red Sea | Red Sea | ✅ correct (article stripped) |
| 600 | 601 | ❌ wrong (number = exact) |
| 600 | 600 | ✅ correct |
| Genesis | Genisis | ✅ correct (fuzzy ~88%) |
| Genesis | Matthew | ❌ wrong (fuzzy too low) |

---

## 7. Scoring System

### Points table

| Situation | Points |
|---|---|
| Correct answer | +1 |
| Wrong or unanswered | 0 |
| First 3 to complete with 50%+ score (bonus) | +0.5 |
| Did not attempt (quiz started after user joined) | −0.5 |
| Did not attempt (quiz started before user joined) | 0 (no penalty) |
| Minimum overall score | 0 (never goes negative) |

### When scores are calculated

- Scores are **NOT calculated at submission time**
- After the quiz window closes (23:59 end day), a cron job runs at 00:15
- The cron job:
  1. Marks all answers as `is_correct = true/false` using the answer matcher
  2. Calculates `raw_score` for each attempt
  3. Identifies the first 3 completions with 50%+ score → sets `bonus_points = 0.5`
  4. Finds users who missed the quiz (joined before quiz started, no attempt row) → deducts 0.5
  5. Updates `overall_scores` table for all affected users
  6. Applies floor: if `total_score < 0` → set to 0

### Dispute score adjustment

- If admin approves a dispute → that answer's `is_correct` flips to true
- Recalculate `raw_score` for the attempt
- Re-check bonus eligibility
- Update `overall_scores` immediately

---

## 8. Quiz Window & Visibility Rules

### During active quiz window

| Element | What is shown |
|---|---|
| Quiz attempt | Open — users can attempt |
| User's submitted answers | Shown exactly as typed |
| Correct answers | Hidden |
| is_correct / marks | Hidden — not calculated yet |
| Results page | Shows "Submitted! Your answers have been recorded. Results will be available after [end date]." |
| Leaderboard | Shows scores from all **previous** quizzes only (frozen) |
| Attempt counter | "X people have attempted this quiz" (no scores) |
| Disputes | Cannot be raised yet |

### After quiz window closes

| Element | What is shown |
|---|---|
| Quiz attempt | Closed — redirects to review page |
| Correct answers | Revealed on review and results pages |
| Marks | Revealed — tick/cross per question |
| Score | Shown on results page |
| Leaderboard | Fully updated including this quiz |
| Disputes | Can now be raised |

---

## 9. User-Facing Pages

### 9.1 Home Page `/`

Mobile-first layout, top to bottom:

- App header: logo, user avatar, sign out
- **Active quiz card** (if one exists) — prominent at top
  - Quiz title and Bible portion
  - "X people have attempted" counter (no scores shown during window)
  - Countdown: shows hours remaining; switches to minutes when under 60 mins; switches to "Xm Ys" in last 10 minutes
  - "Attempt Quiz" button — disabled and greyed if user already completed it
  - If no active quiz: friendly message "No active quiz right now. Check back soon!"
- **Leaderboard section**
  - Toggle: "Overall" / "By Quiz"
  - Overall: running total scores excluding current active quiz, top 10, with expand
  - By Quiz: dropdown listing all closed quizzes — "Genesis 1–10 Quiz (Mar 2)", etc.
  - Each row: rank, profile picture, name, score, proportional bar fill
  - Current user's row highlighted in blue-50
- **Past quizzes list**
  - Card per closed quiz: title, Bible portion, date
  - If user attempted: shows their score
  - If user missed: shows "Not attempted"
  - Tapping opens review page

### 9.2 Quiz Attempt Page `/quiz/[id]`

> Only accessible if quiz is active AND user has not yet completed it.

- Progress bar: "Question 3 of 10"
- Circular countdown timer — 120 seconds per question
  - Green above 60s, amber 30–60s, red below 30s
  - When timer hits 0: auto-saves whatever is typed (even if empty) and moves to next question automatically
- Question text displayed clearly
- **Text input field** — large, mobile-friendly, auto-focus
  - Placeholder: "Type your answer here..."
  - Answer type hint shown below: "Single word answer" or "Enter a number (exact)"
- Answer is saved via API call on every keystroke debounced (500ms) AND on timer expiry
- "Back" button — goes to previous question
  - Shows previous question with submitted answer in a locked, greyed input
  - User can see what they typed but cannot change it
  - Timer does NOT restart — resumes on current question
- "Next" button — enabled always (user can skip by leaving blank, timer will auto-submit)
- On final question: "Next" becomes "Submit Quiz"
- After submit: redirect to `/quiz/[id]/submitted`

### 9.3 Post-Submission Page `/quiz/[id]/submitted`

- Shows: "Your answers have been submitted!"
- Shows each question with what the user typed — no indication of correct/wrong
- Shows: "Results will be revealed after [end date and time]"
- "Back to Home" button

### 9.4 Results Page `/quiz/[id]/results`

> Only shows full results after quiz window has closed.

- If window still open → redirect to `/quiz/[id]/submitted`
- Large score display: "8 / 10"
- Bonus badge if they earned +0.5
- Their rank on this quiz
- Question-by-question breakdown:
  - Question text
  - What they submitted
  - Correct answer(s)
  - Tick ✅ or cross ❌
  - "Dispute this answer" button if marked wrong
- "Share on WhatsApp" — pre-filled: "I scored 8/10 on the Genesis 1–10 Bible Quiz! 🎉"
- "Back to Home" button

### 9.5 Dispute Flow

- User taps "Dispute this answer" on a wrong-marked answer
- Modal opens: text area to explain why they think their answer is correct
- Submit → creates a dispute row with status `'pending'`
- User sees: "Your dispute has been submitted. The admin will review it."
- One dispute per answer only

### 9.6 Past Quiz Review Page `/quiz/[id]/review`

- Read-only, no timers, no inputs
- All questions listed
- Correct answers shown in green
- If user attempted: their submitted answer shown, tick or cross
- If user did not attempt: just questions and correct answers
- "Back" button

---

## 10. Admin Panel

> All `/admin` routes protected by middleware. Non-admins redirected to home.

### 10.1 Admin Dashboard `/admin`

- Summary cards: total users, total quizzes, active quiz name + status
- Table of all quizzes: title, status (Upcoming / Active / Ended), attempt count
- Quick links: Create Quiz, Manage Users, View Disputes

### 10.2 Create Quiz `/admin/quizzes/new`

**Step 1 — Quiz details:**
- Quiz title (e.g. "Genesis 1–10 Quiz")
- Bible portion description (e.g. "Book of Genesis, Chapters 1 to 10")
- Start date picker — admin picks a date
  - Start time auto-set to 12:00 noon
  - End time auto-set to 23:59 the NEXT day (~36 hours)
- Number of questions (number input)
- "Next: Add Questions" button

**Step 2 — Questions form:**

Renders dynamically based on question count. Each question block:

- Question text (textarea)
- **Answer type toggle: Text | Number**
- Accepted answers section:
  - First answer input (required)
  - "+ Add another accepted answer" button — adds more inputs
  - Each additional answer can be removed with an × button
- For Number type: inputs switch to `type="number"`
- Question reorder handles (drag or up/down arrows)

**Validation:**
- All question texts required
- At least one accepted answer per question
- Answer type must be selected
- Correct answers required before saving

**Actions:**
- "Save as Draft" — saves but not visible to users
- "Publish" — makes it live (if start time is in future, it becomes Upcoming)

### 10.3 Edit Quiz `/admin/quizzes/[id]`

- If quiz has not started: full editing allowed
- If quiz is active or ended: read-only — questions shown but not editable
- Submissions table: user name, email, completed_at, score (shown after window closes)
- "Export CSV" button

### 10.4 Disputes `/admin/quizzes/[id]/disputes`

- List of all pending disputes for this quiz
- Each row: user name, question text, their submitted answer, correct answers, their comment
- "Approve" and "Reject" buttons with optional admin note
- Approving a dispute:
  - Flips `is_correct = true` for that answer
  - Recalculates `raw_score` for the attempt
  - Re-checks bonus eligibility
  - Updates `overall_scores` immediately
- Filter: All / Pending / Approved / Rejected

### 10.5 Manage Users `/admin/users`

- Table: name, email, join date, role, overall score
- "Make Admin" / "Remove Admin" toggle per user
- `mahanaimype@gmail.com` shows as "Super Admin" — cannot be demoted — no toggle shown
- Search by name or email

---

## 11. API Routes

### POST `/api/quiz/[id]/start`
- Creates an attempt row if none exists
- Returns first unanswered question index and server timestamp
- Returns 403 if quiz not active or already completed

### POST `/api/quiz/[id]/answer`
```ts
body: {
  question_id: string
  submitted_text: string
  question_started_at: string  // ISO timestamp from server
}
```
- Server checks time elapsed since `question_started_at` ≤ 120 seconds
- If exceeded: saves whatever text was submitted (even partial)
- Saves answer row with `is_correct = null` (not evaluated yet)
- Returns `{ saved: true, next_question_index }` or `{ saved: true, quiz_complete: true }`

### POST `/api/quiz/[id]/complete`
- Marks `is_complete = true` on attempt
- Does NOT calculate score — that happens after window closes
- Returns `{ submitted: true }`

### GET `/api/leaderboard`
```
?type=overall              → overall scores excluding active quiz
?type=quiz&quiz_id=[id]    → per-quiz scores (only for closed quizzes)
```
- Returns `[{ rank, user_id, name, image, score }]` sorted descending

### POST `/api/disputes`
```ts
body: {
  answer_id: string
  comment: string
}
```
- Only allowed after quiz window has closed
- One dispute per answer per user
- Returns `{ created: true }`

### PATCH `/api/admin/disputes/[id]`
```ts
body: {
  status: 'approved' | 'rejected'
  admin_note?: string
}
```
- Admin only
- If approved: triggers score recalculation

### POST `/api/admin/quiz`
- Admin only
- Creates quiz + all questions + accepted answers in a transaction

### PATCH `/api/admin/users`
```ts
body: {
  user_id: string
  role: 'admin' | 'user'
}
```
- Cannot demote `mahanaimype@gmail.com`

---

## 12. Cron Jobs

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-quiz-results",
      "schedule": "15 0 * * *"
    },
    {
      "path": "/api/cron/process-penalties",
      "schedule": "30 0 * * *"
    }
  ]
}
```

### `/api/cron/process-quiz-results`

Runs at 00:15 daily. For each quiz that ended in the last 24 hours:

1. For every answer in every completed attempt:
   - Run answer matcher against `accepted_answers`
   - Set `is_correct = true/false`
2. Calculate `raw_score` per attempt (count of `is_correct = true`)
3. Sort completed attempts by `completed_at` ascending
4. First 3 where `raw_score / question_count >= 0.5` → set `bonus_points = 0.5`
5. Update `overall_scores` for all users who attempted
6. Mark quiz as results-processed

### `/api/cron/process-penalties`

Runs at 00:30 daily. For each quiz processed in the last 24 hours:

1. Find all users where `created_at < quiz.start_time`
2. Exclude users who have an attempt row for this quiz
3. Deduct 0.5 from their `overall_scores.total_score`
4. Apply floor: if `total_score < 0` → set to 0
5. Increment `quizzes_missed`
6. Mark as penalty-processed to avoid double runs

---

## 13. UI & Design Guidelines

- **Mobile-first** — design for 375px width upward. Majority of users are on phones
- Tailwind CSS throughout
- **Colour palette:**
  - Primary: `#2563eb` / `#1d4ed8` (blue)
  - Success: `#16a34a` (green)
  - Warning: `#d97706` (amber)
  - Danger: `#dc2626` (red)
  - Background: `#f8fafc` (slate)
- **Timer ring:** SVG circular progress — green → amber → red as time depletes
- **Answer input:** large, full-width, rounded, prominent — easy to type on mobile keyboard
- **Active quiz card:** bold blue card at top of home page — unmissable
- **All touch targets:** minimum 48px height for mobile usability
- **Loading states:** skeleton loaders on leaderboard and quiz list
- **Toast notifications:** answer saved, quiz submitted, dispute raised, errors
- **Locked answer display:** greyed-out input with padlock icon when viewing previous questions

---

## 14. Deployment Checklist

1. Push code to GitHub
2. Connect repo to Vercel — framework preset: Next.js
3. Add all environment variables in Vercel dashboard
4. In NeonDB: create new project, copy connection string to `DATABASE_URL`
5. Run `npx drizzle-kit push` to create tables in production
6. In Google Cloud Console:
   - Create OAuth 2.0 credentials
   - Authorised origins: `https://yourapp.vercel.app`
   - Redirect URI: `https://yourapp.vercel.app/api/auth/callback/google`
7. Deploy — Vercel auto-deploys on every push to `main`
8. Test login with `mahanaimype@gmail.com` — confirm admin panel is accessible
9. Create a test quiz — verify start/end time calculation
10. Test answer submission and confirm answers are hidden until window closes

---

## 15. Build Order for Claude Code

Build in this exact order to avoid blockers:

1. **Project setup** — Next.js 14, TypeScript, Tailwind, Drizzle, NeonDB connection
2. **Database schema** — all tables via Drizzle ORM (`npx drizzle-kit push`)
3. **Auth** — NextAuth Google provider, session with role, middleware for `/admin` routes
4. **Answer matcher** — `lib/answer-matcher.ts` with fuzzy match + number exact match + article stripping. Write unit tests for this.
5. **Admin: Create Quiz** — quiz form with dynamic question blocks, answer type toggle, multiple accepted answers, save to DB
6. **Home page** — active quiz card with countdown + past quizzes list (no leaderboard yet)
7. **Quiz attempt flow** — start, 120s timer, text input, save on keystroke, back navigation (locked), auto-submit on timer, complete
8. **Post-submission page** — shows submitted answers only, no marks, countdown to results
9. **Cron: process-quiz-results** — answer marking, score calculation, bonus points
10. **Cron: process-penalties** — missed quiz deductions, floor at 0
11. **Results page** — only visible after window closes, full breakdown with dispute button
12. **Dispute flow** — raise dispute modal, admin dispute management page, score recalculation on approval
13. **Leaderboard** — overall (excluding active quiz) + per-quiz dropdown
14. **Admin: Manage Users** — promote/demote, super-admin protection
15. **Polish** — skeleton loaders, toasts, WhatsApp share, mobile testing, empty states

---

*BibleQuiz PRD | Mahanaimype Church | Built with Next.js + NeonDB + Vercel*
