# Keep Them Home

> **Before you give up your pet, find out what would have to change for them to stay.**

**Keep Them Home** is a pre-surrender intervention and decision-support system for pet owners facing difficult circumstances such as housing problems, behavior issues, veterinary costs, financial pressure, moving, temporary crises, lack of time, or major family changes.

Instead of asking:

> *"How do I surrender my pet?"*

Keep Them Home asks:

> **"What would actually have to change for this pet to stay home?"**

The system turns a complicated real-life situation into structured constraints, evaluates possible retention paths, identifies what is blocking them, calculates the smallest changes that could unlock them, and connects owners with concrete next steps and support.

**Built as a solo project for AnimalHack 2026.**

---

## Live Demo

**Live application:**  
https://keep-them-home.vercel.app

### Demo account

Judges and reviewers can use the pre-populated demo account:

```text
Username: demouser
Password: DemoUser@123456
```

> The demo account contains synthetic data created specifically to demonstrate the application. No real pet-owner information is represented by the demo case.

### Recommended demo

After signing in:

1. Open **My Pets**
2. Select **Luna**
3. Continue Luna's case
4. Review her Housing + Behavior + Cost constraints
5. Compare the generated retention paths
6. Open a blocked or conditional path
7. Select **What Would Unlock This?**
8. Apply a change using the What-If experience
9. Watch the decision engine recompute the path
10. Review evidence, resources, and possible actions

The key interaction is:

```text
BLOCKED
   ↓
Identify Blocker
   ↓
Smallest Unlock
   ↓
Apply Change
   ↓
Recompute
   ↓
Updated Path
```

---

#  Inspiration

Keep Them Home started with something I have seen firsthand: sometimes a family does not stop loving their dog—the circumstances around them simply become impossible.

I have observed dogs struggling with separation anxiety and severe anxiety. A dog may bark continuously when their owner leaves, become intensely protective, or react fearfully when other people enter their space.

Those behaviors affect the animal, but they can also have serious consequences for the person caring for them.

The idea became especially personal after watching a friend face an extreme version of this problem. Her dog experienced severe anxiety and became intensely protective of her. The dog struggled around other people and eventually began biting. The situation escalated until my friend faced eviction.

What stayed with me was that this was not simply a **behavior problem**.

It was a combination of:

- behavior
- housing
- safety
- money
- time
- access to support

When several constraints collide at once, an owner may feel like surrendering or rehoming their pet is the only option left.

That led to the question behind Keep Them Home:

> **Before someone gives up their pet, can technology help them understand what would actually have to change for that pet to stay home?**

---

#  The Problem

Pet surrender is often treated like a single decision.

In reality, it can involve several interacting constraints:

- Housing
- Behavior
- Money
- Veterinary needs
- Moving
- Temporary homelessness or crisis
- Lack of time
- Family changes
- Work obligations
- Emergency situations

An owner may feel like they have **"no choice"** even though one or two specific constraints are driving the entire situation.

Many existing services are valuable for finding resources, beginning shelter intake, or supporting rehoming.

Keep Them Home explores a different computational layer:

> **Can we model the owner's situation, evaluate multiple ways the pet could stay, and calculate what would need to change for one of those paths to become possible?**

---

#  Core Idea

The core workflow is:

```text
Story
  ↓
Constraints
  ↓
Retention Paths
  ↓
Feasible / Conditional / Blocked
  ↓
Blockers
  ↓
Smallest Unlock
  ↓
Actions
  ↓
Real-World Result
  ↓
Fact Update
  ↓
Recompute
  ↓
Outcome
```

Or, more simply:

> **Story → Constraints → Paths → Blocker → Smallest Unlock → Recompute → Action**

---

# 🔓 Smallest Unlock

The centerpiece of Keep Them Home is **Smallest Unlock**.

A traditional resource system might answer:

> *"What services could help me?"*

Keep Them Home goes one step further:

> **"Why is this particular path impossible right now?"**

and then:

> **"What is the smallest realistic change that could make it possible?"**

For example, imagine an owner says:

> *"My landlord is threatening eviction because Luna barks while I'm at work. I have a week and can't afford a trainer."*

Keep Them Home can structure that situation as:

```text
Primary constraint
└── Housing

Contributing constraints
├── Behavior
└── Cost

Urgency
└── 7 days
```

The system can then evaluate possible paths such as:

```text
Stay with Luna
├── Resolve housing complaint
└── Address barking

Temporary-care bridge
├── Arrange temporary care
├── Resolve housing issue
└── Reunite

Move with Luna
└── Secure viable pet-friendly housing
```

Each path is evaluated against the known facts and classified as:

### FEASIBLE

The currently known circumstances allow the path.

### CONDITIONAL

The path could work, but something still needs to be resolved or confirmed.

### BLOCKED

One or more known constraints currently prevent the path.

For a blocked path, Keep Them Home identifies the blocker and calculates the smallest supported change that could improve its status.

```text
BLOCKED
   ↓
Smallest Unlock
   ↓
What-If Change
   ↓
Recompute
   ↓
FEASIBLE / CONDITIONAL / BLOCKED
```

---

# What It Does

Keep Them Home includes:

-  Pet profiles
-  Natural-language story intake
-  Guided multi-factor assessment
-  AI-assisted case understanding
-  Multi-constraint modeling
-  Retention-path generation
-  Feasible / Conditional / Blocked classifications
-  Blocker detection
-  Smallest Unlock calculation
-  What-If exploration
-  Evidence-backed recommendations
-  Support resources
-  Personal action planning
-  Progress tracking
-  Automatic path re-computation
-  Privacy-conscious similar situations
-  Outcome tracking
-  Responsible rehoming support when staying together is no longer feasible

---

#  Architecture

Keep Them Home deliberately separates **language understanding** from **decision-making**.

The core technical principle is:

> ## AI understands. Code decides. Evidence supports.

AI is useful for understanding messy human language.

It should not independently decide whether someone can keep their pet.

```text
┌──────────────────────────┐
│        Pet Owner         │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ React + TypeScript + Vite│
│         Frontend         │
└────────────┬─────────────┘
             │
             │ HTTPS / JSON
             ▼
┌──────────────────────────┐
│ Vercel Server Functions  │
│        API Layer         │
└───────┬──────────┬───────┘
        │          │
        │          │
        ▼          ▼
┌─────────────┐  ┌─────────────┐
│    Clerk    │  │    Groq     │
│    Auth     │  │     AI      │
└─────────────┘  └──────┬──────┘
                        │
                        │ Structured facts
                        ▼
              ┌─────────────────────┐
              │ Deterministic Solver│
              │                     │
              │ • Constraints       │
              │ • Paths             │
              │ • Blockers          │
              │ • Smallest Unlock   │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Services / Evidence │
              │ / Resource Layer    │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   Neon PostgreSQL   │
              │   + Drizzle ORM     │
              │   + pgvector        │
              └─────────────────────┘
```

---

#  AI + Deterministic Decision Making

One of the most important design decisions in Keep Them Home is defining **where AI stops**.

Suppose an owner writes:

```text
"My landlord is threatening eviction because Luna
barks while I'm at work. I have a week and can't
afford a trainer."
```

AI can transform that into structured information:

```json
{
  "primaryBarrier": "housing",
  "contributingBarriers": [
    "behavior",
    "cost"
  ],
  "urgency": "This week",
  "goal": null
}
```

The AI does **not** decide:

```text
"This person should keep their dog."
```

It also does not independently decide:

```text
"This path is feasible."
```

Instead, structured facts are passed to deterministic application logic.

```text
Human Story
     │
     ▼
┌─────────────┐
│     AI      │
│ Understands │
└──────┬──────┘
       │
       ▼
Structured Facts
       │
       ▼
┌─────────────┐
│    Code     │
│   Decides   │
└──────┬──────┘
       │
       ▼
Paths + Blockers
       │
       ▼
┌─────────────┐
│  Evidence   │
│  Supports   │
└─────────────┘
```

This makes feasibility decisions more consistent, inspectable, and reproducible.

---

#  Counterfactual Decision Engine

Smallest Unlock works as a constrained counterfactual search.

Given:

```text
Current facts + path requirements
```

the system asks:

```text
What is the minimum supported change
that would improve this path's status?
```

Candidate changes are evaluated deterministically.

The engine prioritizes:

1. The fewest constraints changed
2. Lower modeled burden when alternatives are tied
3. The highest-ranked supported minimal solution

This is what allows Keep Them Home to move from:

> **"Here are some resources."**

to:

> **"This is what is blocking this path, and this is what would need to change."**

---

#  Multi-Factor Model

Keep Them Home models seven major categories:

| Constraint | Examples |
|---|---|
| Housing | landlord issues, pet restrictions, moving |
| Money | affordability, deposits, support costs |
| Behavior | barking, anxiety, behavior concerns |
| Veterinary | medical needs, treatment access |
| Temporary Crisis | short-term instability or emergency |
| Time / Capacity | work schedules, caregiving capacity |
| Family / Life Change | household or major life changes |

A case can contain:

```text
One Primary Constraint
        +
Multiple Contributing Constraints
```

This matters because real-world surrender situations rarely have only one cause.

---

#  Actions and Real-World Results

Keep Them Home makes an important distinction:

> **Tracking an action is not the same as changing a fact.**

For example:

```text
Action:
Contact landlord

Status:
COMPLETED
```

does **not** automatically mean:

```text
Landlord approved the pet
```

The user must report the actual result.

Only when that result changes a trusted case fact should the solver recompute the available paths.

Action states can include:

```text
PLANNED
IN_PROGRESS
COMPLETED
NOT_POSSIBLE
```

This creates a closed loop:

```text
Plan
  ↓
Action
  ↓
Real-world result
  ↓
Fact changes
  ↓
Recompute
  ↓
New options
```

---

#  Similar Situations

Keep Them Home also explores privacy-conscious retrieval of similar situations using **PostgreSQL + pgvector**.

The goal is to help answer:

> **"What did people facing circumstances like mine try?"**

Similarity is based on structured, privacy-safe case characteristics rather than exposing another owner's raw story or personal information.

The feature is descriptive, not predictive.

> **Similarity describes circumstances, not likelihood of success.**

Synthetic examples are explicitly labeled.

Keep Them Home does not use similar cases to claim that an owner has a certain probability of keeping their pet.

---

#  Data Model

At a high level:

```text
User
 │
 ├── Pet
 │    │
 │    └── Case
 │         │
 │         ├── Factors / Facts
 │         ├── Paths
 │         ├── Actions
 │         ├── Outcomes
 │         └── Similarity Profile
 │
 └── Additional Pets
```

A pet can exist without an active case.

This allows **My Pets** to function as the user's pet-management area while **Dashboard** focuses on active cases and situations requiring attention.

---

#  Authentication & Persistence

Authentication is handled through **Clerk**.

Authenticated users can maintain persistent:

- Pet profiles
- Cases
- Case factors
- Actions
- Situation updates
- Outcomes

Protected API operations enforce ownership so users can access only their own pet and case data.

---

#  Built With

| Layer | Technology |
|---|---|
| Frontend | React |
| Language | TypeScript |
| Build Tool | Vite |
| Deployment | Vercel |
| API | Vercel Server Functions |
| Authentication | Clerk |
| Database | Neon PostgreSQL |
| ORM | Drizzle ORM |
| AI | Groq |
| Vector Search | pgvector |
| Interface | REST / JSON |

---

#  Project Structure

```text
KeepThemHome/
│
├── api/
│   └── router.ts
│
├── server/
│   ├── api-handlers/
│   ├── db/
│   ├── services/
│   └── domain/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   └── domain/
│
├── drizzle/
│
├── public/
│
├── package.json
├── vite.config.ts
├── vercel.json
└── README.md
```

---

#  Running Locally

## Prerequisites

You will need:

- Node.js
- pnpm
- A Neon PostgreSQL database
- A Clerk application
- Groq API credentials

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd KeepThemHome
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Copy the example environment configuration:

```bash
cp .env.example .env.local
```

Configure the required values:

```env
DATABASE_URL=

VITE_CLERK_PUBLISHABLE_KEY=
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_AUTHORIZED_PARTIES=

GROQ_API_KEY=
GROQ_MODEL=
```

> Never commit `.env.local`, `.env.production`, database credentials, Clerk secret keys, or Groq API keys.

### 4. Start development

```bash
pnpm dev
```

### 5. Validate the project

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Refer to `package.json` for the exact scripts available in the current repository.

---

# Demo Data

The demo account contains a synthetic pet named **Luna**.

```text
Luna
└── Dog

Case
├── Primary: Housing
├── Contributing: Behavior
├── Contributing: Cost
├── Urgency: 7 days
└── Goal: Unknown
```

Luna exists to demonstrate the complete multi-factor decision flow without exposing information about a real pet owner.

Where supported by the repository, demo data can be seeded using:

```bash
pnpm seed:demo
```

The seed operation should be idempotent so repeated runs do not continuously create duplicate demo records.

---

#  Privacy & Security

Keep Them Home was designed with several boundaries in mind:

- Protected API routes require authentication
- Pet and case operations enforce ownership
- Database credentials remain server-side
- Groq credentials remain server-side
- Clerk secret keys remain server-side
- Similar-case representations exclude unnecessary personal information
- Synthetic demo cases are clearly identified

These secrets should **never** be exposed through `VITE_` environment variables:

```text
DATABASE_URL
CLERK_SECRET_KEY
GROQ_API_KEY
```

Only browser-safe publishable configuration should be exposed to the frontend.

---

#  Responsible Use

Keep Them Home is a **decision-support prototype**.

It is not a replacement for:

- Veterinary diagnosis
- Professional animal behavior assessment
- Legal advice
- Emergency services
- Qualified safety evaluation

Situations involving bites, aggression, medical emergencies, immediate danger, or threats to human or animal safety may require professional intervention.

Keep Them Home does not assume that every pet can or should remain in their current home.

When staying together is no longer safe or realistically feasible, **responsible rehoming remains an important path**.

The goal is not to shame someone for considering surrender.

The goal is to make sure realistic alternatives have been understood first.

---

# 🧪 Design Principles

Several distinctions are fundamental to the system:

```text
AI interpretation ≠ feasibility decision

Action completed ≠ underlying fact changed

Path feasible ≠ successful outcome

Similarity ≠ prediction
```

And:

> **UI exists ≠ feature works.**

The application is designed around persistent, testable state rather than presenting recommendations that only exist on screen.

---

#  What's Next

## Local Resource Intelligence

Connect identified blockers with relevant nearby:

- Behavior professionals
- Veterinary assistance
- Temporary care
- Housing resources
- Financial support
- Community programs

## Longitudinal Case Tracking

Continue improving how changing circumstances affect a case:

```text
Situation changes
      ↓
Facts update
      ↓
Solver recomputes
      ↓
Available paths change
```

## Follow-Ups and Reminders

Help owners remember time-sensitive actions and deadlines.

## Similar Situation Intelligence

Expand privacy-safe retrieval so owners can learn what people facing comparable circumstances tried without turning similarity into a prediction.

## Shelter & Rescue Integration

Explore Keep Them Home as a pre-surrender and intake-diversion tool for shelters, rescues, veterinarians, behavior professionals, and community organizations.

---

# AnimalHack 2026

**Keep Them Home was designed and built as a solo project for AnimalHack 2026.**

I designed and developed the:

- Product concept
- User experience
- React frontend
- TypeScript application
- Backend and API architecture
- PostgreSQL data model
- Authentication integration
- AI-assisted intake
- Deterministic decision engine
- Smallest Unlock system
- What-If system
- Evidence architecture
- Action tracking
- Similar-case architecture
- Production deployment

The project explores a computational layer between understanding **why** someone may surrender a pet and determining **what could realistically change their available options**.

---

# The Vision

Sometimes the problem is not that someone wants to give up their pet.

Sometimes several constraints have made them believe they have no other choice.

**Keep Them Home is designed to help find those choices.**

> ## Before a pet loses their home, understand what it would actually take to keep them there.

---

## Author

**Aishwarya Jakka**

Solo developer and creator of **Keep Them Home**.

Built for **AnimalHack 2026**.
