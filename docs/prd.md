# Requirements Document

## 1. Application Overview

**Application Name:** Keep Them Home

**Application Description:** A responsive homepage and assessment flow that helps pet owners explore options before considering pet surrender. Users can provide pet information, identify their primary challenge, and complete the Housing or Behavior assessment pathway to receive a personalized action plan. Users can then provide outcome feedback through a follow-up flow, including access to responsible rehoming guidance when keeping the pet is not possible.

**Scope:** This document covers the responsive homepage, the first two screens of the assessment experience (Pet Information and Root Cause Selection), the complete Housing Assessment pathway (3 questions), the complete Behavior Assessment pathway (4 questions with safety notice), the Assessment Complete transition screens, the Housing Action Plan screen with local state management, the Outcome/Follow-Up flow (4 screens), and the Responsible Rehoming pathway. Full outcome follow-up for Behavior pathway and additional pathways are out of scope.

---

## 2. User and Usage Scenario

**Target User:** Pet owners considering surrender or rehoming due to housing, behavior, cost, medical care, or life circumstances.

**Core Scenario:** User visits homepage, clicks primary CTA to enter assessment flow, provides pet information, selects Housing or Behavior as primary challenge, completes corresponding assessment (3 questions for Housing or 4 questions for Behavior), reaches Assessment Complete transition screen, views action plan (Housing only in scope), provides outcome feedback through follow-up flow, and may access responsible rehoming guidance if keeping the pet is not possible.

---

## 3. Page Structure and Functionality

### Page Structure

```
Homepage
├── Header
├── Hero Section
├── How It Works Section
├── Trust/Disclaimer Section
└── Footer

Assessment Flow
├── Screen 1: Pet Information
├── Screen 2: Root Cause Selection
├── Housing Assessment
│   ├── Step 1 of 3: Housing Situation
│   ├── Step 2 of 3: Timing Urgency
│   ├── Step 3 of 3: Stay or Move Goal
│   └── Assessment Complete Transition Screen
├── Behavior Assessment
│   ├── Step 1 of 4: Behavior Type
│   ├── Step 2 of 4: Seriousness Level
│   │   └── Immediate Safety Notice (conditional)
│   ├── Step 3 of 4: Already Tried
│   ├── Step 4 of 4: Barrier to Help
│   └── Assessment Complete Transition Screen
├── Housing Action Plan Screen
├── Outcome / Follow-Up Flow
│   ├── Screen 1: Outcome Check-In
│   ├── Outcome 1: Keeping Pet
│   ├── Outcome 2: Still Trying
│   └── Outcome 3: Rehoming Help
└── Responsible Rehoming Pathway
    └── Responsible Rehoming Screen
```

### 3.1 Homepage - Header

**Layout:**
- Minimal header with generous whitespace
- Official logo positioned on the left
- Logo asset: `/images/logo.png`
- No traditional nonprofit navigation elements (no About Us, Our Work, Donate, Volunteer, Contact)

**Logo Requirements:**
- Preserve original proportions
- Do not redraw, recolor, stretch, or crop
- Maintain adequate whitespace around logo

### 3.2 Homepage - Hero Section

**Headline:**
- Text: \"Before you give them up, let's see what's possible.\"
- Typography: Playfair Display
- Visual hierarchy: Dominant visual element on page
- No oversized duplicate logo in hero area

**Supporting Text:**
- Text: \"If keeping your pet has become difficult, we'll help you understand your options before surrender becomes the only one.\"
- Typography: Inter

**Primary CTA:**
- Button text: \"Find options for my pet →\"
- Button color: Forest #2E5440
- Text color: Light (for contrast against Forest background)
- Typography: Inter
- Interaction: Hover state uses slightly darker Forest
- Functionality: Transitions user into assessment flow (Screen 1: Pet Information)

**Subtext:**
- Text: \"No judgment. No account required.\"
- Typography: Inter
- Placement: Below primary CTA

### 3.3 Homepage - How It Works Section

**Section Title:**
- Text: \"How it works\"
- Typography: Playfair Display or Inter (appropriate hierarchy)

**Steps:**

**Step 01:**
- Label: \"01\"
- Heading: \"Tell us what's happening\"
- Description: \"Share what is making it difficult to keep your pet.\"

**Step 02:**
- Label: \"02\"
- Heading: \"Explore possible solutions\"
- Description: \"We'll help organize the situation and identify options worth exploring.\"

**Step 03:**
- Label: \"03\"
- Heading: \"Make a plan\"
- Description: \"Leave with clear next steps and resources to consider.\"

**Visual Style:**
- Simple, elegant, sophisticated presentation
- Not brightly colored feature cards
- Use subtle visual hierarchy and whitespace
- Typography: Inter for step text

### 3.4 Homepage - Trust/Disclaimer Section

**Content:**
- Text: \"Keep Them Home provides informational guidance and does not replace veterinary, legal, behavioral, or emergency services.\"
- Typography: Inter
- Visual treatment: Subtle note, not prominent

### 3.5 Homepage - Footer

**Requirements:**
- Extremely minimal footer
- No fake addresses, phone numbers, social media accounts, donation links, partner logos, or impact statistics
- May include basic copyright or minimal legal text if necessary

### 3.6 Screen 1: Pet Information

**Small Label:**
- Text: \"LET'S START\"
- Typography: Inter
- Visual treatment: Subtle, uppercase

**Main Heading:**
- Text: \"First, who are we helping?\"
- Typography: Playfair Display

**Supporting Text:**
- Text: \"Tell us a little about your pet so we can personalize the experience.\"
- Typography: Inter

**Pet Name Input:**
- Label: \"Pet name\"
- Placeholder: \"Luna\"
- Required field
- Typography: Inter

**Pet Type Selection:**
- Label: \"Pet type\"
- 3 selection cards: Dog, Cat, Other
- Card design: Restrained icons, selected state with Forest #2E5440 border and subtle accent background
- Single selection only
- Required field

**Primary CTA:**
- Button text: \"Continue →\"
- Button color: Forest #2E5440
- Text color: Light (for contrast)
- Typography: Inter
- State: Disabled until both pet name is entered and pet type is selected
- Functionality: Transitions to Screen 2 (Root Cause Selection) and stores pet name and pet type in local state

### 3.7 Screen 2: Root Cause Selection

**Small Label:**
- Text: \"WHAT'S GOING ON?\"
- Typography: Inter
- Visual treatment: Subtle, uppercase

**Main Heading:**
- Text: \"What's making it hard to keep [PET NAME]?\"
- Typography: Playfair Display
- Dynamic content: [PET NAME] replaced with pet name from Screen 1

**Supporting Text:**
- Text: \"Choose the challenge that feels most important right now.\"
- Typography: Inter

**Challenge Cards (5 total):**

**Card 1 - HOUSING:**
- Heading: \"HOUSING\"
- Description: \"Landlord, moving, deposits, or pet restrictions.\"
- Interaction: Selectable, transitions to Housing Assessment Step 1

**Card 2 - BEHAVIOR:**
- Heading: \"BEHAVIOR\"
- Description: \"Barking, destruction, separation, conflict, or other behavior challenges.\"
- Interaction: Selectable, transitions to Behavior Assessment Step 1

**Card 3 - COST:**
- Heading: \"COST\"
- Description: \"Food, supplies, or unexpected expenses.\"
- Interaction: Shows supportive message \"We're still building this support pathway.\" and \"Choose another challenge\" button to return to root-cause options

**Card 4 - MEDICAL CARE:**
- Heading: \"MEDICAL CARE\"
- Description: \"Veterinary costs or ongoing care needs.\"
- Interaction: Shows supportive message \"We're still building this support pathway.\" and \"Choose another challenge\" button to return to root-cause options

**Card 5 - LIFE CIRCUMSTANCES:**
- Heading: \"LIFE CIRCUMSTANCES\"
- Description: \"Moving, illness, family changes, or temporary hardship.\"
- Interaction: Shows supportive message \"We're still building this support pathway.\" and \"Choose another challenge\" button to return to root-cause options

**Back Navigation:**
- Subtle Back control to return to Screen 1
- Preserves pet name and pet type when returning
- When returning forward to Screen 2, preserves previous selections

### 3.8 Housing Assessment - Step 1 of 3: Housing Situation

**Progress Indicator:**
- Text: \"HOUSING • STEP 1 OF 3\"
- Typography: Inter
- Visual treatment: Subtle, uppercase, uses Sage #A7B89F or Forest #2E5440

**Main Heading:**
- Text: \"What's happening with your housing?\"
- Typography: Playfair Display

**Supporting Text:**
- Text: \"Choose the option that best describes what's making it difficult to keep [PET NAME].\"
- Typography: Inter
- Dynamic content: [PET NAME] replaced with pet name from Screen 1

**Selection Options (5 cards):**
- \"My landlord or property says pets aren't allowed\"
- \"I can't afford the pet deposit or fee\"
- \"I'm moving and struggling to find pet-friendly housing\"
- \"There's a breed or size restriction\"
- \"I'm temporarily between homes\"

**Card Design:**
- Selected state with Forest #2E5440 border and subtle accent background
- Single selection only

**Primary CTA:**
- Button text: \"Continue →\"
- Button color: Forest #2E5440
- Text color: Light (for contrast)
- Typography: Inter
- State: Disabled until one option is selected
- Functionality: Transitions to Housing Assessment Step 2 and stores Q1 answer in local state

**Back Navigation:**
- Subtle Back control to return to Screen 2 (Root Cause Selection)
- Preserves all previous state

### 3.9 Housing Assessment - Step 2 of 3: Timing Urgency

**Progress Indicator:**
- Text: \"HOUSING • STEP 2 OF 3\"
- Typography: Inter
- Visual treatment: Subtle, uppercase, uses Sage #A7B89F or Forest #2E5440

**Main Heading:**
- Text: \"How soon do you need a solution?\"
- Typography: Playfair Display

**Supporting Text:**
- Text: \"This helps us understand how urgent the situation is.\"
- Typography: Inter

**Selection Options (4 cards):**
- \"Today or within 48 hours\"
- \"This week\"
- \"Within a month\"
- \"I'm planning ahead\"

**Card Design:**
- Selected state with Forest #2E5440 border and subtle accent background
- Single selection only

**Primary CTA:**
- Button text: \"Continue →\"
- Button color: Forest #2E5440
- Text color: Light (for contrast)
- Typography: Inter
- State: Disabled until one option is selected
- Functionality: Transitions to Housing Assessment Step 3 and stores Q2 answer in local state

**Back Navigation:**
- Subtle Back control to return to Housing Assessment Step 1
- Preserves Q1 selection

### 3.10 Housing Assessment - Step 3 of 3: Stay or Move Goal

**Progress Indicator:**
- Text: \"HOUSING • STEP 3 OF 3\"
- Typography: Inter
- Visual treatment: Subtle, uppercase, uses Sage #A7B89F or Forest #2E5440

**Main Heading:**
- Text: \"Are you trying to stay where you are or move?\"
- Typography: Playfair Display

**Supporting Text:**
- Text: \"We'll use this to focus the next steps on what may be most useful.\"
- Typography: Inter

**Selection Options (3 cards):**
- \"Stay where I am\"
- \"Move\"
- \"Either could work\"

**Card Design:**
- Selected state with Forest #2E5440 border and subtle accent background
- Single selection only

**Primary CTA:**
- Button text: \"See my options →\"
- Button color: Forest #2E5440
- Text color: Light (for contrast)
- Typography: Inter
- State: Disabled until one option is selected
- Functionality: Transitions to Housing Assessment Complete Transition Screen and stores Q3 answer in local state

**Back Navigation:**
- Subtle Back control to return to Housing Assessment Step 2
- Preserves Q1 and Q2 selections

### 3.11 Housing Assessment Complete Transition Screen

**Small Label:**
- Text: \"ASSESSMENT COMPLETE\"
- Typography: Inter
- Visual treatment: Subtle, uppercase

**Main Heading:**
- Text: \"We're putting together a plan for [PET NAME].\"
- Typography: Playfair Display
- Dynamic content: [PET NAME] replaced with pet name from Screen 1

**Supporting Text:**
- Text: \"We'll use what you told us to focus on the most relevant next steps.\"
- Typography: Inter

**Summary Section:**
- **Primary challenge:** Housing
- **Situation:** [Q1 selected answer]
- **Timing:** [Q2 selected answer]
- **Goal:** [Q3 selected answer]

**Summary Design:**
- Clean, organized presentation
- Typography: Inter
- Uses Charcoal #2D2D2D for labels and text

**Primary CTA:**
- Button text: \"Continue →\"
- Button color: Forest #2E5440
- Text color: Light (for contrast)
- Typography: Inter
- Functionality: Transitions to Housing Action Plan Screen

**Back Navigation:**
- Subtle Back control to return to Housing Assessment Step 3
- Preserves all previous selections

### 3.12 Behavior Assessment - Step 1 of 4: Behavior Type

**Progress Indicator:**
- Text: \"BEHAVIOR • STEP 1 OF 4\"
- Typography: Inter
- Visual treatment: Subtle, uppercase, uses Sage #A7B89F or Forest #2E5440

**Main Heading:**
- Text: \"What behavior is making things difficult with [PET NAME]?\"
- Typography: Playfair Display
- Dynamic content: [PET NAME] replaced with pet name from Screen 1

**Supporting Text:**
- Text: \"Choose the behavior that feels most challenging right now.\"
- Typography: Inter

**Selection Options (7 cards):**
- \"Aggression toward people or animals\"
- \"Excessive barking or noise\"
- \"Destructive behavior\"
- \"Separation anxiety\"
- \"House soiling or litter box issues\"
- \"Reactivity on walks or in public\"
- \"Other behavior concern\"

**Card Design:**
- Selected state with Forest #2E5440 border and subtle accent background
- Single selection only

**Primary CTA:**
- Button text: \"Continue →\"
- Button color: Forest #2E5440
- Text color: Light (for contrast)
- Typography: Inter
- State: Disabled until one option is selected
- Functionality: Transitions to Behavior Assessment Step 2 and stores Behavior Q1 answer in local state

**Back Navigation:**
- Subtle Back control to return to Screen 2 (Root Cause Selection)
- Preserves all previous state

### 3.13 Behavior Assessment - Step 2 of 4: Seriousness Level

**Progress Indicator:**
- Text: \"BEHAVIOR • STEP 2 OF 4\"
- Typography: Inter
- Visual treatment: Subtle, uppercase, uses Sage #A7B89F or Forest #2E5440

**Main Heading:**
- Text: \"How serious does the situation feel?\"
- Typography: Playfair Display

**Supporting Text:**
- Text: \"This helps us understand the urgency and severity.\"
- Typography: Inter

**Selection Options (4 cards):**
- \"There's an immediate safety concern\"
- \"It's serious and getting worse\"
- \"It's manageable but frustrating\"
- \"It's mild but I want to address it\"

**Card Design:**
- Selected state with Forest #2E5440 border and subtle accent background
- Single selection only

**Immediate Safety Notice (conditional):**
- **Trigger:** User selects \"There's an immediate safety concern\"
- **Display:** Modal or inline notice appears immediately after selection
- **Content:**
  + Heading: \"Safety comes first.\"
  + Body text: \"If a person or animal may be in immediate danger, create distance where it is safe to do so and seek qualified professional help. Keep Them Home cannot assess or diagnose dangerous behavior.\"
  + Button text: \"I understand →\"
  + Button color: Forest #2E5440
  + Button functionality: Dismisses notice and enables primary CTA
- **Typography:** Playfair Display for heading, Inter for body text and button
- **Visual treatment:** Clear, calm, non-alarming presentation

**Primary CTA:**
- Button text: \"Continue →\"
- Button color: Forest #2E5440
- Text color: Light (for contrast)
- Typography: Inter
- State: Disabled until one option is selected (and safety notice acknowledged if applicable)
- Functionality: Transitions to Behavior Assessment Step 3 and stores Behavior Q2 answer in local state

**Back Navigation:**
- Subtle Back control to return to Behavior Assessment Step 1
- Preserves Behavior Q1 selection

### 3.14 Behavior Assessment - Step 3 of 4: Already Tried

**Progress Indicator:**
- Text: \"BEHAVIOR • STEP 3 OF 4\"
- Typography: Inter
- Visual treatment: Subtle, uppercase, uses Sage #A7B89F or Forest #2E5440

**Main Heading:**
- Text: \"What have you already tried?\"
- Typography: Playfair Display

**Supporting Text:**
- Text: \"Select any approaches you've already attempted.\"
- Typography: Inter

**Selection Options (6 cards):**
- \"Training classes or sessions\"
- \"Medication or supplements\"
- \"Environmental changes\"
- \"Online resources or videos\"
- \"Advice from friends or family\"
- \"Nothing yet\"

**Card Design:**
- Selected state with Forest #2E5440 border and subtle accent background
- Single selection only

**Primary CTA:**
- Button text: \"Continue →\"
- Button color: Forest #2E5440
- Text color: Light (for contrast)
- Typography: Inter
- State: Disabled until one option is selected
- Functionality: Transitions to Behavior Assessment Step 4 and stores Behavior Q3 answer in local state

**Back Navigation:**
- Subtle Back control to return to Behavior Assessment Step 2
- Preserves Behavior Q1 and Q2 selections

### 3.15 Behavior Assessment - Step 4 of 4: Barrier to Help

**Progress Indicator:**
- Text: \"BEHAVIOR • STEP 4 OF 4\"
- Typography: Inter
- Visual treatment: Subtle, uppercase, uses Sage #A7B89F or Forest #2E5440

**Main Heading:**
- Text: \"What makes getting help difficult?\"
- Typography: Playfair Display

**Supporting Text:**
- Text: \"Understanding barriers helps us suggest realistic next steps.\"
- Typography: Inter

**Selection Options (6 cards):**
- \"Cost of professional help\"
- \"Don't know where to start\"
- \"Time or scheduling constraints\"
- \"Lack of local resources\"
- \"Unsure if help will work\"
- \"No major barriers\"

**Card Design:**
- Selected state with Forest #2E5440 border and subtle accent background
- Single selection only

**Primary CTA:**
- Button text: \"See my options →\"
- Button color: Forest #2E5440
- Text color: Light (for contrast)
- Typography: Inter
- State: Disabled until one option is selected
- Functionality: Transitions to Behavior Assessment Complete Transition Screen and stores Behavior Q4 answer in local state

**Back Navigation:**
- Subtle Back control to return to Behavior Assessment Step 3
- Preserves Behavior Q1, Q2, and Q3 selections

### 3.16 Behavior Assessment Complete Transition Screen

**Small Label:**
- Text: \"ASSESSMENT COMPLETE\"
- Typography: Inter
- Visual treatment: Subtle, uppercase

**Main Heading:**
- Text: \"We're putting together a plan for [PET NAME].\"
- Typography: Playfair Display
- Dynamic content: [PET NAME] replaced with pet name from Screen 1

**Supporting Text:**
- Text: \"We'll use what you told us to focus on the most relevant next steps.\"
- Typography: Inter

**Summary Section:**
- **Primary challenge:** Behavior
- **Main concern:** [Behavior Q1 selected answer]
- **Seriousness:** [Behavior Q2 selected answer]
- **Already tried:** [Behavior Q3 selected answer]
- **Barrier to help:** [Behavior Q4 selected answer]

**Summary Design:**
- Clean, organized presentation
- Typography: Inter
- Uses Charcoal #2D2D2D for labels and text

**Primary CTA:**
- Button text: \"Continue →\"
- Button color: Forest #2E5440
- Text color: Light (for contrast)
- Typography: Inter
- Functionality: Placeholder for future flow (Behavior Action Plan not in scope)

**Back Navigation:**
- Subtle Back control to return to Behavior Assessment Step 4
- Preserves all previous selections

### 3.17 Housing Action Plan Screen

**Small Status Label:**
- Text: \"WE FOUND SOME OPTIONS\"
- Typography: Inter
- Visual treatment: Subtle, uppercase

**Main Heading:**
- Text: \"Your Keep [PET NAME] Home Plan\"
- Typography: Playfair Display
- Dynamic content: [PET NAME] replaced with pet name from Screen 1
- Example: \"Your Keep Luna Home Plan\"

**Supporting Text:**
- Text: \"Based on what you told us, here are three things worth trying before making a permanent decision.\"
- Typography: Inter

**Dynamic Situation Summary:**
- Deterministic text built from stored Q1, Q2, Q3 answers
- Example format: \"You're trying to [Q3 answer], your housing situation needs attention [Q2 answer], and [Q1 answer].\"
- Typography: Inter
- Uses Charcoal #2D2D2D

**Three Prioritized Action Cards:**

**STEP 01 Card:**
- Badge: \"DO THIS FIRST\"
- Heading: \"Understand the exact housing restriction\"
- Description: Brief explanation of this action
- Rationale: \"Why this comes first\" with explanation
- Visual priority: Emphasized design to indicate primary importance

**STEP 02 Card:**
- Badge: \"TRY THIS NEXT\"
- Heading: \"Explore housing support\"
- Description: Brief explanation of this action
- Rationale: \"Why it may help\" with explanation

**STEP 03 Card:**
- Badge: \"CREATE A BACKUP PLAN\"
- Heading: \"Consider a temporary bridge\"
- Description: Brief explanation of this action
- Rationale: \"Why it may help\" with explanation

**Action Card Design:**
- Clean, organized presentation
- Typography: Inter for body text, Playfair Display for headings
- Uses Forest #2E5440 for badges or emphasis
- Subtle visual hierarchy to distinguish priority

**Resources Section:**

**Section Heading:**
- Text: \"Resources that may help\"
- Typography: Playfair Display or Inter (appropriate hierarchy)

**Section Supporting Text:**
- Text: \"Start with the type of support that best matches your situation.\"
- Typography: Inter

**3 Prototype Resource Cards:**

**Resource Card 1:**
- Badge: \"HOUSING SEARCH\"
- Title: \"Pet-Friendly Housing Directory\"
- Label: \"Example resource\"
- CTA: \"View resource →\"

**Resource Card 2:**
- Badge: \"FINANCIAL SUPPORT\"
- Title: \"Pet Deposit Assistance\"
- Label: \"Example resource\"
- Additional label: \"Low-cost / assistance\"
- CTA: \"View resource →\"

**Resource Card 3:**
- Badge: \"TEMPORARY CARE\"
- Title: \"Temporary Foster Support\"
- Label: \"Example resource\"
- CTA: \"View resource →\"

**Resource Card Design:**
- Clean, organized presentation
- Typography: Inter
- Uses Warm Sand #E3C9B2 or Sage #A7B89F for badges
- Subtle borders or backgrounds

**Safety Disclaimer:**
- Text: \"These prototype resources are examples. Availability and eligibility should always be verified.\"
- Typography: Inter
- Visual treatment: Subtle note below resource cards

**Final Decision Area:**

**Heading:**
- Text: \"What would you like to do next?\"
- Typography: Playfair Display or Inter (appropriate hierarchy)

**Primary CTA:**
- Button text: \"I'll try this plan →\"
- Button color: Forest #2E5440
- Text color: Light (for contrast)
- Typography: Inter
- Functionality: Transitions to Outcome Check-In Screen

**Secondary CTA:**
- Button text: \"I still need other options\"
- Visual treatment: Secondary button style (outline or muted)
- Typography: Inter
- Functionality: Placeholder for future flow (not in scope)

**Back Navigation:**
- Text: \"← Back to my answers\"
- Functionality: Returns to Housing Assessment Complete Transition Screen with all state preserved
- Typography: Inter

### 3.18 Outcome Check-In Screen

**Small Label:**
- Text: \"CHECKING IN\"
- Typography: Inter
- Visual treatment: Subtle, uppercase

**Main Heading:**
- Text: \"How are things with [PET NAME]?\"
- Typography: Playfair Display
- Dynamic content: [PET NAME] replaced with pet name from Screen 1
- Example: \"How are things with Luna?\"

**Supporting Text:**
- Text: \"We want to know whether the plan helped.\"
- Typography: Inter

**Selection Options (3 cards):**

**Option 1:**
- Heading: \"We're keeping [PET NAME]\"
- Description: \"We found a path forward and plan to keep our pet.\"
- Visual treatment: Subtle Sage #A7B89F treatment
- Dynamic content: [PET NAME] replaced with pet name from Screen 1

**Option 2:**
- Heading: \"We're still trying\"
- Description: \"We're working through the plan but still need time or support.\"

**Option 3:**
- Heading: \"We still need rehoming help\"
- Description: \"Keeping our pet may not be possible and we need help understanding responsible next steps.\"

**Card Design:**
- Selected state with Forest #2E5440 border and subtle accent background
- Single selection only
- Each card includes heading and description

**Primary CTA:**
- Button text: \"Continue →\"
- Button color: Forest #2E5440
- Text color: Light (for contrast)
- Typography: Inter
- State: Disabled until one option is selected
- Functionality: Transitions to corresponding outcome screen based on selection and stores outcome in local state

**Back Navigation:**
- Text: \"← Back to my plan\"
- Functionality: Returns to Housing Action Plan Screen with all state preserved
- Typography: Inter

### 3.19 Outcome 1: Keeping Pet Screen

**Small Label:**
- Text: \"GOOD NEWS\"
- Typography: Inter
- Visual treatment: Subtle, uppercase

**Main Heading:**
- Text: \"[PET NAME] is staying home.\"
- Typography: Playfair Display
- Dynamic content: [PET NAME] replaced with pet name from Screen 1
- Example: \"Luna is staying home.\"

**Supporting Text:**
- Text: \"Thank you for letting us know.\"
- Typography: Inter

**Body Text:**
- Text: \"Every situation is different. We're glad you found a path that works for you and [PET NAME].\"
- Typography: Inter
- Dynamic content: [PET NAME] replaced with pet name from Screen 1

**Summary Card:**

**Card Heading:**
- Text: \"Your journey\"
- Typography: Playfair Display or Inter (appropriate hierarchy)

**Card Content:**
- Pet: [PET NAME]
- Challenge: Housing
- Plan: 3 steps explored
- Outcome: Staying together

**Card Design:**
- Clean, organized presentation
- Typography: Inter
- Uses Charcoal #2D2D2D for labels and text

**Primary CTA:**
- Button text: \"Start another case\"
- Button color: Forest #2E5440
- Text color: Light (for contrast)
- Typography: Inter
- Functionality: Clears all local state and returns to Homepage

**Secondary CTA:**
- Button text: \"Review my plan\"
- Visual treatment: Secondary button style (outline or muted)
- Typography: Inter
- Functionality: Returns to Housing Action Plan Screen with all state preserved

### 3.20 Outcome 2: Still Trying Screen

**Small Label:**
- Text: \"KEEP GOING\"
- Typography: Inter
- Visual treatment: Subtle, uppercase

**Main Heading:**
- Text: \"Let's keep working on it.\"
- Typography: Playfair Display

**Supporting Text:**
- Text: \"Sometimes the first option doesn't solve the whole problem. You can revisit your plan or explore another path.\"
- Typography: Inter

**Primary CTA:**
- Button text: \"Review my plan\"
- Button color: Forest #2E5440
- Text color: Light (for contrast)
- Typography: Inter
- Functionality: Returns to Housing Action Plan Screen with all state preserved

**Secondary CTA:**
- Button text: \"Explore other options\"
- Visual treatment: Secondary button style (outline or muted)
- Typography: Inter
- Functionality: Returns to Screen 2 (Root Cause Selection) with all state preserved

### 3.21 Outcome 3: Rehoming Help Screen

**Small Label:**
- Text: \"OTHER OPTIONS\"
- Typography: Inter
- Visual treatment: Subtle, uppercase

**Main Heading:**
- Text: \"Sometimes keeping them home isn't possible.\"
- Typography: Playfair Display

**Supporting Text:**
- Text: \"Responsible rehoming can still protect [PET NAME]'s wellbeing. We'll help you think through safe next steps without judgment.\"
- Typography: Inter
- Dynamic content: [PET NAME] replaced with pet name from Screen 1

**Additional Text:**
- Text: \"Choosing to explore responsible rehoming does not erase the effort you've already made.\"
- Typography: Inter

**Primary CTA:**
- Button text: \"Explore responsible rehoming →\"
- Button color: Forest #2E5440
- Text color: Light (for contrast)
- Typography: Inter
- Functionality: Transitions to Responsible Rehoming Screen

**Secondary CTA:**
- Button text: \"Return to my plan\"
- Visual treatment: Secondary button style (outline or muted)
- Typography: Inter
- Functionality: Returns to Housing Action Plan Screen with all state preserved

### 3.22 Responsible Rehoming Screen

**Small Label:**
- Text: \"RESPONSIBLE REHOMING\"
- Typography: Inter
- Visual treatment: Subtle, uppercase

**Main Heading:**
- Text: \"Let's find the safest next step for [PET NAME].\"
- Typography: Playfair Display
- Dynamic content: [PET NAME] replaced with pet name from Screen 1

**Supporting Text:**
- Text: \"If keeping [PET NAME] isn't realistically possible, preparing carefully can help make the transition safer and less stressful.\"
- Typography: Inter
- Dynamic content: [PET NAME] replaced with pet name from Screen 1

**Context Message:**
- Text: \"You've already explored options for keeping [PET NAME] at home. Choosing another path does not erase that effort.\"
- Typography: Inter
- Dynamic content: [PET NAME] replaced with pet name from Screen 1

**Four Prioritized Guidance Cards:**

**STEP 01 Card:**
- Badge: \"PREPARE\"
- Heading: \"Create an accurate pet profile\"
- Description: \"Gather clear information about [PET NAME]'s health, behavior, routine, preferences, medications, and history.\"
- Note: \"Being transparent helps potential caregivers understand whether they're a good fit.\"
- Dynamic content: [PET NAME] replaced with pet name from Screen 1

**STEP 02 Card:**
- Badge: \"START CLOSE TO HOME\"
- Heading: \"Reach out to people and organizations you trust\"
- Description: \"Consider trusted friends, family, veterinary contacts, rescues, or other reputable animal-welfare organizations before using an unknown placement.\"
- Note: \"A trusted connection may provide more context and accountability during the transition.\"

**STEP 03 Card:**
- Badge: \"PLACE CAREFULLY\"
- Heading: \"Screen potential homes\"
- Description: \"Ask thoughtful questions about the potential home, household members, other animals, experience, expectations, and long-term plans.\"
- Note: \"Finding the right fit matters more than finding the fastest placement.\"

**STEP 04 Card:**
- Badge: \"TRANSITION SAFELY\"
- Heading: \"Prepare for the transition\"
- Description: \"When possible, send relevant veterinary records, medication information, feeding instructions, routines, and familiar belongings with [PET NAME].\"
- Note: \"Continuity can make a major change easier for both the pet and the new caregiver.\"
- Dynamic content: [PET NAME] replaced with pet name from Screen 1

**Guidance Card Design:**
- Clean, organized presentation
- Typography: Inter for body text, Playfair Display for headings
- Uses Forest #2E5440 or Warm Sand #E3C9B2 for badges
- Subtle visual hierarchy

**Safety Notice:**

**Heading:**
- Text: \"Safety matters\"
- Typography: Playfair Display or Inter (appropriate hierarchy)

**Body Text:**
- Text: \"Be honest about known medical or behavior concerns. If [PET NAME] has a history of serious aggression or there is an immediate safety concern, seek guidance from a qualified veterinary or animal-behavior professional rather than attempting an informal placement.\"
- Typography: Inter
- Dynamic content: [PET NAME] replaced with pet name from Screen 1

**Support Section:**

**Heading:**
- Text: \"Need more support?\"
- Typography: Playfair Display or Inter (appropriate hierarchy)

**Body Text:**
- Text: \"Shelters, rescues, veterinary teams, and community organizations may be able to provide guidance depending on your location and situation.\"
- Typography: Inter

**CTA:**
- Button text: \"Find shelter or rescue support →\"
- Visual treatment: Secondary button style (outline or muted)
- Typography: Inter
- Functionality: Placeholder for future flow (not in scope)

**Note:**
- Text: \"Resource availability varies by location. Always verify information directly with the organization.\"
- Typography: Inter
- Visual treatment: Subtle note

**Final Decision Area:**

**Heading:**
- Text: \"What would you like to do?\"
- Typography: Playfair Display or Inter (appropriate hierarchy)

**Primary CTA:**
- Button text: \"Return to my Keep [PET NAME] Home Plan\"
- Button color: Forest #2E5440
- Text color: Light (for contrast)
- Typography: Inter
- Dynamic content: [PET NAME] replaced with pet name from Screen 1
- Functionality: Returns to Housing Action Plan Screen with all state preserved

**Secondary CTA:**
- Button text: \"Start another case\"
- Visual treatment: Secondary button style (outline or muted)
- Typography: Inter
- Functionality: Clears all local state and returns to Homepage

**Back Navigation:**
- Text: \"← Back\"
- Functionality: Returns to Outcome 3 (Rehoming Help) Screen with all state preserved
- Typography: Inter

---

## 4. Brand System

### 4.1 Color Palette

- **Forest:** #2E5440 — Primary buttons, important headings, active states, selected card borders, progress indicator, badges
- **Sage:** #A7B89F — Soft backgrounds, supportive UI elements, subtle accents, progress indicator, badges
- **Warm Sand:** #E3C9B2 — Highlights, badges, warm visual moments
- **Cream:** #FAF7F2 — Dominant page background
- **Charcoal:** #2D2D2D — Body text and high-contrast UI

### 4.2 Typography

- **Playfair Display:** Major headings and emotional brand statements (hero headline, section titles, screen main headings, action plan heading, outcome screen headings, responsible rehoming heading)
- **Inter:** Body text, buttons, labels, navigation, UI elements, small labels, progress indicators, action card content, resource card content, outcome screen body text, responsible rehoming body text

### 4.3 Visual Principles

- Calm, compassionate, trustworthy, hopeful, sophisticated, human
- Generous whitespace
- Subtle rounded cards (if applicable)
- Restrained shadows
- Strong hierarchy
- Accessible contrast
- Avoid cartoon-heavy pet styling, bright colors, excessive gradients, glassmorphism, generic AI/SaaS aesthetics, clutter, excessive animations
- No celebratory animations or confetti

---

## 5. Business Rules and Logic

### 5.1 State Management

**Local State Storage:**
- Pet name (string)
- Pet type (Dog/Cat/Other)
- Selected root cause (Housing/Behavior)
- Housing Q1 answer (string)
- Housing Q2 answer (string)
- Housing Q3 answer (string)
- Behavior Q1 answer (string)
- Behavior Q2 answer (string)
- Behavior Q3 answer (string)
- Behavior Q4 answer (string)
- Outcome (keeping/stillTrying/rehomingHelp)

**State Persistence:**
- State persists when navigating back through any screen
- State persists when navigating forward through any screen
- No backend storage or database integration

**State Clearing:**
- \"Start another case\" button on Outcome 1 (Keeping Pet) screen clears all local state
- \"Start another case\" button on Responsible Rehoming screen clears all local state
- All other navigation actions preserve all state

### 5.2 Navigation Flow

**Homepage → Screen 1:**
- Triggered by clicking \"Find options for my pet →\" button

**Screen 1 → Screen 2:**
- Triggered by clicking \"Continue →\" button
- Only enabled when both pet name and pet type are provided

**Screen 2 → Screen 1:**
- Triggered by clicking Back control
- Preserves pet name and pet type

**Screen 2 → Housing Step 1:**
- Triggered by selecting Housing challenge card

**Screen 2 → Behavior Step 1:**
- Triggered by selecting Behavior challenge card

**Housing Step 1 → Screen 2:**
- Triggered by clicking Back control
- Preserves all previous state

**Housing Step 1 → Housing Step 2:**
- Triggered by clicking \"Continue →\" button
- Only enabled when Q1 option is selected

**Housing Step 2 → Housing Step 1:**
- Triggered by clicking Back control
- Preserves Q1 selection

**Housing Step 2 → Housing Step 3:**
- Triggered by clicking \"Continue →\" button
- Only enabled when Q2 option is selected

**Housing Step 3 → Housing Step 2:**
- Triggered by clicking Back control
- Preserves Q1 and Q2 selections

**Housing Step 3 → Housing Assessment Complete:**
- Triggered by clicking \"See my options →\" button
- Only enabled when Q3 option is selected

**Housing Assessment Complete → Housing Step 3:**
- Triggered by clicking Back control
- Preserves all previous selections

**Housing Assessment Complete → Housing Action Plan:**
- Triggered by clicking \"Continue →\" button

**Behavior Step 1 → Screen 2:**
- Triggered by clicking Back control
- Preserves all previous state

**Behavior Step 1 → Behavior Step 2:**
- Triggered by clicking \"Continue →\" button
- Only enabled when Behavior Q1 option is selected

**Behavior Step 2 → Behavior Step 1:**
- Triggered by clicking Back control
- Preserves Behavior Q1 selection

**Behavior Step 2 → Behavior Step 3:**
- Triggered by clicking \"Continue →\" button
- Only enabled when Behavior Q2 option is selected (and safety notice acknowledged if applicable)

**Behavior Step 3 → Behavior Step 2:**
- Triggered by clicking Back control
- Preserves Behavior Q1 and Q2 selections

**Behavior Step 3 → Behavior Step 4:**
- Triggered by clicking \"Continue →\" button
- Only enabled when Behavior Q3 option is selected

**Behavior Step 4 → Behavior Step 3:**
- Triggered by clicking Back control
- Preserves Behavior Q1, Q2, and Q3 selections

**Behavior Step 4 → Behavior Assessment Complete:**
- Triggered by clicking \"See my options →\" button
- Only enabled when Behavior Q4 option is selected

**Behavior Assessment Complete → Behavior Step 4:**
- Triggered by clicking Back control
- Preserves all previous selections

**Housing Action Plan → Housing Assessment Complete:**
- Triggered by clicking \"← Back to my answers\"
- Preserves all previous selections

**Housing Action Plan → Outcome Check-In:**
- Triggered by clicking \"I'll try this plan →\" button

**Outcome Check-In → Housing Action Plan:**
- Triggered by clicking \"← Back to my plan\"
- Preserves all previous selections

**Outcome Check-In → Outcome 1/2/3:**
- Triggered by clicking \"Continue →\" button after selecting outcome option
- Only enabled when one option is selected
- Transitions to corresponding outcome screen based on selection

**Outcome 1 (Keeping Pet) → Housing Action Plan:**
- Triggered by clicking \"Review my plan\" button
- Preserves all previous selections

**Outcome 1 (Keeping Pet) → Homepage:**
- Triggered by clicking \"Start another case\" button
- Clears all local state

**Outcome 2 (Still Trying) → Housing Action Plan:**
- Triggered by clicking \"Review my plan\" button
- Preserves all previous selections

**Outcome 2 (Still Trying) → Screen 2:**
- Triggered by clicking \"Explore other options\" button
- Preserves all previous selections

**Outcome 3 (Rehoming Help) → Housing Action Plan:**
- Triggered by clicking \"Return to my plan\" button
- Preserves all previous selections

**Outcome 3 (Rehoming Help) → Responsible Rehoming:**
- Triggered by clicking \"Explore responsible rehoming →\" button
- Preserves all previous selections

**Responsible Rehoming → Outcome 3 (Rehoming Help):**
- Triggered by clicking \"← Back\"
- Preserves all previous selections

**Responsible Rehoming → Housing Action Plan:**
- Triggered by clicking \"Return to my Keep [PET NAME] Home Plan\" button
- Preserves all previous selections

**Responsible Rehoming → Homepage:**
- Triggered by clicking \"Start another case\" button
- Clears all local state

**Screen 2 Challenge Selection:**
- Housing: Transitions to Housing Assessment Step 1
- Behavior: Transitions to Behavior Assessment Step 1
- Cost, Medical Care, Life Circumstances: Display supportive message with \"Choose another challenge\" button

### 5.3 Dynamic Content

**Pet Name Replacement:**
- Screen 2 main heading dynamically replaces [PET NAME] with actual pet name from Screen 1
- Housing Step 1 supporting text dynamically replaces [PET NAME] with actual pet name from Screen 1
- Behavior Step 1 main heading dynamically replaces [PET NAME] with actual pet name from Screen 1
- Housing Assessment Complete main heading dynamically replaces [PET NAME] with actual pet name from Screen 1
- Behavior Assessment Complete main heading dynamically replaces [PET NAME] with actual pet name from Screen 1
- Housing Action Plan main heading dynamically replaces [PET NAME] with actual pet name from Screen 1
- Outcome Check-In main heading dynamically replaces [PET NAME] with actual pet name from Screen 1
- Outcome Check-In Option 1 heading dynamically replaces [PET NAME] with actual pet name from Screen 1
- Outcome 1 main heading dynamically replaces [PET NAME] with actual pet name from Screen 1
- Outcome 1 body text dynamically replaces [PET NAME] with actual pet name from Screen 1
- Outcome 1 summary card dynamically replaces [PET NAME] with actual pet name from Screen 1
- Outcome 3 supporting text dynamically replaces [PET NAME] with actual pet name from Screen 1
- Responsible Rehoming main heading dynamically replaces [PET NAME] with actual pet name from Screen 1
- Responsible Rehoming supporting text dynamically replaces [PET NAME] with actual pet name from Screen 1
- Responsible Rehoming context message dynamically replaces [PET NAME] with actual pet name from Screen 1
- Responsible Rehoming STEP 01 description dynamically replaces [PET NAME] with actual pet name from Screen 1
- Responsible Rehoming STEP 04 description dynamically replaces [PET NAME] with actual pet name from Screen 1
- Responsible Rehoming safety notice body text dynamically replaces [PET NAME] with actual pet name from Screen 1
- Responsible Rehoming primary CTA dynamically replaces [PET NAME] with actual pet name from Screen 1

**Summary Content Replacement:**
- Housing Assessment Complete summary section displays selected answers from Housing Q1, Q2, Q3
- Behavior Assessment Complete summary section displays selected answers from Behavior Q1, Q2, Q3, Q4
- Housing Action Plan situation summary deterministically builds text from Q1, Q2, Q3 answers

**Deterministic Situation Summary Logic:**
- Combines Q3 (goal), Q2 (timing), Q1 (situation) into natural language sentence
- Example: \"You're trying to stay where you are, your housing situation needs attention this week, and your landlord or property says pets aren't allowed.\"
- Pure local state logic, no AI generation

### 5.4 Immediate Safety Notice Logic

**Trigger Condition:**
- User selects \"There's an immediate safety concern\" on Behavior Step 2

**Display Behavior:**
- Notice appears immediately after selection (modal or inline)
- Primary CTA remains disabled until user acknowledges notice by clicking \"I understand →\"
- After acknowledgment, notice dismisses and primary CTA becomes enabled

**State Management:**
- Safety notice acknowledgment is not stored in persistent state
- If user navigates back to Behavior Step 2 and reselects \"There's an immediate safety concern\", notice appears again

---

## 6. Responsive Requirements

**Mobile-First Approach:**
- No horizontal overflow
- Comfortable tap targets (minimum 44x44px)
- Readable typography at all viewport sizes
- Responsive layout adapts from mobile to desktop
- Clear hierarchy maintained across breakpoints

**Desktop Presentation:**
- Professional appearance suitable for presentation
- Maintain brand sophistication
- Generous whitespace preserved

**Accessibility:**
- Semantic HTML structure
- Accessible labels for interactive elements
- Adequate color contrast (WCAG AA minimum)
- Visible keyboard focus states
- No information conveyed only by color

---

## 7. Interaction States

### Primary CTA Button (Homepage, Screen 1, Housing Steps, Behavior Steps, Assessment Complete Screens, Housing Action Plan, Outcome Check-In, Outcome Screens, Responsible Rehoming Screen)

**Default State:**
- Background: Forest #2E5440
- Text: Light color for contrast
- Typography: Inter

**Hover State:**
- Background: Slightly darker Forest

**Focus State:**
- Visible focus indicator for keyboard navigation

**Disabled State:**
- Reduced opacity or muted appearance
- Not clickable until required selections are made

### Secondary CTA Button (Housing Action Plan, Outcome Screens, Responsible Rehoming Screen)

**Default State:**
- Outline or muted style
- Typography: Inter

**Hover State:**
- Subtle visual feedback

**Focus State:**
- Visible focus indicator for keyboard navigation

### Selection Cards (Screen 1, Screen 2, Housing Steps, Behavior Steps, Outcome Check-In)

**Default State:**
- Neutral background
- Subtle border

**Hover State:**
- Subtle visual feedback

**Selected State:**
- Border: Forest #2E5440
- Background: Subtle accent (Sage or Warm Sand)

**Focus State:**
- Visible focus indicator for keyboard navigation

### Resource Cards (Housing Action Plan)

**Default State:**
- Clean presentation with badge, title, labels
- Subtle border or background

**Hover State:**
- Subtle visual feedback on \"View resource →\" CTA

**Focus State:**
- Visible focus indicator for keyboard navigation

### Back Control (Screen 2, Housing Steps, Behavior Steps, Assessment Complete Screens, Housing Action Plan, Outcome Check-In, Responsible Rehoming Screen)

**Default State:**
- Subtle visual treatment
- Typography: Inter

**Hover State:**
- Subtle visual feedback

**Focus State:**
- Visible focus indicator for keyboard navigation

### Immediate Safety Notice (Behavior Step 2)

**Default State:**
- Modal or inline notice with clear heading and body text
- \"I understand →\" button in Forest #2E5440

**Button Hover State:**
- Slightly darker Forest

**Button Focus State:**
- Visible focus indicator for keyboard navigation

---

## 8. Exception and Boundary Cases

| Scenario | Handling |
|----------|----------|
| User clicks \"Continue →\" without entering pet name | Button remains disabled |
| User clicks \"Continue →\" without selecting pet type | Button remains disabled |
| User clicks \"Continue →\" on Housing steps without selecting option | Button remains disabled |
| User clicks \"Continue →\" on Behavior steps without selecting option | Button remains disabled |
| User clicks \"Continue →\" on Outcome Check-In without selecting option | Button remains disabled |
| User enters pet name with special characters | Accept input as-is |
| User enters extremely long pet name | Display full name in dynamic headings |
| User selects Cost/Medical Care/Life Circumstances | Display supportive message \"We're still building this support pathway.\" with \"Choose another challenge\" button |
| User clicks Back from Screen 2 | Return to Screen 1 with pet name and pet type preserved |
| User clicks Back from Housing Step 1 | Return to Screen 2 with all previous state preserved |
| User clicks Back from Housing Step 2 | Return to Housing Step 1 with Q1 selection preserved |
| User clicks Back from Housing Step 3 | Return to Housing Step 2 with Q1 and Q2 selections preserved |
| User clicks Back from Housing Assessment Complete | Return to Housing Step 3 with all selections preserved |
| User clicks Back from Behavior Step 1 | Return to Screen 2 with all previous state preserved |
| User clicks Back from Behavior Step 2 | Return to Behavior Step 1 with Behavior Q1 selection preserved |
| User clicks Back from Behavior Step 3 | Return to Behavior Step 2 with Behavior Q1 and Q2 selections preserved |
| User clicks Back from Behavior Step 4 | Return to Behavior Step 3 with Behavior Q1, Q2, and Q3 selections preserved |
| User clicks Back from Behavior Assessment Complete | Return to Behavior Step 4 with all selections preserved |
| User clicks \"← Back to my answers\" from Housing Action Plan | Return to Housing Assessment Complete with all selections preserved |
| User clicks \"← Back to my plan\" from Outcome Check-In | Return to Housing Action Plan with all selections preserved |
| User clicks \"← Back\" from Responsible Rehoming | Return to Outcome 3 (Rehoming Help) with all selections preserved |
| User returns forward after going back | All previous selections are preserved |
| User selects Housing on Screen 2 | Transition to Housing Assessment Step 1 |
| User selects Behavior on Screen 2 | Transition to Behavior Assessment Step 1 |
| User selects \"There's an immediate safety concern\" on Behavior Step 2 | Display immediate safety notice, disable primary CTA until acknowledged |
| User acknowledges safety notice on Behavior Step 2 | Dismiss notice, enable primary CTA |
| User navigates back to Behavior Step 2 after acknowledging safety notice | If \"There's an immediate safety concern\" is reselected, notice appears again |
| User completes Housing assessment | Reach Housing Assessment Complete screen with summary of all answers |
| User completes Behavior assessment | Reach Behavior Assessment Complete screen with summary of all answers |
| User clicks \"Continue →\" from Housing Assessment Complete | Transition to Housing Action Plan screen |
| User clicks \"Continue →\" from Behavior Assessment Complete | Placeholder for future flow (Behavior Action Plan not in scope) |
| User clicks \"I'll try this plan →\" on Housing Action Plan | Transition to Outcome Check-In screen |
| User clicks \"I still need other options\" on Housing Action Plan | Placeholder for future flow (not in scope) |
| User clicks \"View resource →\" on resource cards | Placeholder for future flow (not in scope) |
| User selects \"We're keeping [PET NAME]\" on Outcome Check-In | Transition to Outcome 1 (Keeping Pet) screen |
| User selects \"We're still trying\" on Outcome Check-In | Transition to Outcome 2 (Still Trying) screen |
| User selects \"We still need rehoming help\" on Outcome Check-In | Transition to Outcome 3 (Rehoming Help) screen |
| User clicks \"Start another case\" on Outcome 1 | Clear all local state and return to Homepage |
| User clicks \"Review my plan\" on Outcome 1 | Return to Housing Action Plan with all state preserved |
| User clicks \"Review my plan\" on Outcome 2 | Return to Housing Action Plan with all state preserved |
| User clicks \"Explore other options\" on Outcome 2 | Return to Screen 2 with all state preserved |
| User clicks \"Explore responsible rehoming →\" on Outcome 3 | Transition to Responsible Rehoming screen with all state preserved |
| User clicks \"Return to my plan\" on Outcome 3 | Return to Housing Action Plan with all state preserved |
| User clicks \"Return to my Keep [PET NAME] Home Plan\" on Responsible Rehoming | Return to Housing Action Plan with all state preserved |
| User clicks \"Start another case\" on Responsible Rehoming | Clear all local state and return to Homepage |
| User clicks \"Find shelter or rescue support →\" on Responsible Rehoming | Placeholder for future flow (not in scope) |

---

## 9. Acceptance Criteria

1. User lands on homepage
2. User sees official Keep Them Home logo in header
3. User reads hero headline \"Before you give them up, let's see what's possible.\"
4. User clicks \"Find options for my pet →\" button and transitions to Screen 1
5. User enters pet name and selects pet type on Screen 1
6. User clicks \"Continue →\" button and transitions to Screen 2
7. User sees personalized heading with pet name on Screen 2
8. User selects Housing challenge and completes Housing assessment (3 steps)
9. User reaches Housing Assessment Complete screen with summary of all Housing answers
10. User clicks \"Continue →\" from Housing Assessment Complete and transitions to Housing Action Plan screen
11. User sees Housing Action Plan with personalized heading, dynamic situation summary, three prioritized action cards, and three prototype resource cards
12. User clicks \"I'll try this plan →\" and transitions to Outcome Check-In screen
13. User sees Outcome Check-In screen with personalized heading and three outcome options
14. User selects \"We still need rehoming help\" and clicks \"Continue →\" to reach Outcome 3 screen
15. User sees Outcome 3 screen with personalized heading, supporting text, and two CTAs
16. User clicks \"Explore responsible rehoming →\" and transitions to Responsible Rehoming screen
17. User sees Responsible Rehoming screen with personalized heading, supporting text, context message, four prioritized guidance cards, safety notice, support section, and final decision area
18. User clicks \"Return to my Keep [PET NAME] Home Plan\" and returns to Housing Action Plan with all state preserved
19. User navigates back to Outcome Check-In and selects \"We're keeping [PET NAME]\"
20. User clicks \"Continue →\" and reaches Outcome 1 screen with personalized heading, body text, summary card, and two CTAs
21. User clicks \"Start another case\" and returns to Homepage with all state cleared

---

## 10. Out of Scope for This Release

- Behavior Action Plan screen and flow
- Full action plan generation beyond Housing pathway
- Additional pathways beyond Housing and Behavior assessment
- Backend functionality
- Database integration
- User authentication
- Full navigation beyond Outcome screens and Responsible Rehoming screen
- Analytics
- Form validation beyond required field checks
- Dynamic content beyond pet name replacement and deterministic situation summary
- CMS integration
- Multilingual support
- Social sharing
- Newsletter signup
- Donation functionality
- Admin dashboard
- File size/type restrictions
- Performance optimization specifications
- Browser compatibility details beyond responsive design
- Device-specific adaptations beyond responsive design
- Animation specifications beyond hover states
- Loading states
- Error handling beyond disabled button states
- Network timeout handling
- Data persistence beyond local state
- Export or print functionality
- Email notifications
- Progress indicators beyond Housing and Behavior assessment progress text
- Save and resume functionality
- Resource card linking to actual external resources
- Secondary CTA functionality on Housing Action Plan screen (\"I still need other options\")
- Primary CTA functionality on Behavior Assessment Complete screen (\"Continue →\")
- Secondary CTA functionality on Responsible Rehoming screen (\"Find shelter or rescue support →\")
- Celebratory animations or confetti on Outcome screens
