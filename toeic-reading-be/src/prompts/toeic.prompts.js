/**
 * Prompt templates for TOEIC question generation.
 * Aligned with the official ETS New Format (2016+, still current):
 *  - Part 5: Q101-130, 30x Incomplete Sentences
 *  - Part 6: Q131-146, 4 passages x 4 blanks (Text Completion, incl. sentence insertion)
 *  - Part 7: Q147-200, 54x Reading Comprehension (Single / Double / Triple passages)
 * Moved from the Angular UI's OmnirouteService to the backend.
 *
 * Each part keeps an explicit Easy / Medium / Hard difficulty framework AND a full
 * ETS coverage bank (structures, grammar, phrases, vocabulary, sentence patterns)
 * so generated items stay close to the real exam.
 */

export function buildPart5Prompt(count) {
  return `You are an expert TOEIC test writer for ETS. Generate exactly ${count} TOEIC Part 5 (Incomplete Sentences, official questions 101-130) that match the difficulty, tone, and style of official TOEIC exams.

## OFFICIAL FORMAT GROUNDING (MUST FOLLOW)

- Real Part 5 = 30 questions (Q101-130). Each item = ONE single English sentence with exactly ONE blank marked '_______', followed by 4 options (A)/(B)/(C)/(D).
- Register: formal international business English. NO slang, NO US-only idioms, NO jokes, NO academic/literary topics.
- Contexts (rotate, do not repeat the same context twice in a row): office administration, HR/recruitment, finance/accounting, marketing/sales, logistics/shipping, manufacturing, customer service, IT systems, facilities/maintenance, travel/conferences, contracts/compliance, real estate/leasing.
- Names: common international names (Mr. Kim, Ms. Garcia, Patel, Nguyen...). Dates, prices, times realistic.
- Sentence length: 10-25 words. Blank position varies across the batch (beginning / middle / end).
- Question text and options are 100% ENGLISH. Vietnamese appears ONLY in 'translation' and 'explanation' fields.

## CATEGORY DISTRIBUTION (MANDATORY)

Distribute across the batch like the real exam (round as needed for ${count} questions):
- ~40% Grammar, ~40% Vocabulary, ~20% Word Forms. All three categories MUST appear.
- Correct answer positions (correctAnswer 0-3) balanced ~25% each; NEVER 3 identical in a row.
- All 4 options: same part of speech and similar length (difference <= 2 words), UNLESS testing word forms (then same root). NO duplicates, NO double-acceptable answers, NO 'all of the above'.

## FULL ETS COVERAGE BANK — PART 5 (rotate topics, do not repeat the same rule twice in a row)

A. GRAMMAR structures (must all be usable across batches):
1. Verb tense & aspect: simple past vs present perfect vs past perfect ("has completed" vs "completed"), future (will / be going to / present continuous for schedules).
2. Passive voice: be + past participle, incl. modals ("must be submitted"), causative have/get ("had the documents printed").
3. Subject-verb agreement incl. traps: intervening phrases ("The list of suppliers ___ long"), indefinite pronouns (each/every/either/neither + singular), collective nouns.
4. Participles & reduced clauses: -ed vs -ing adjectives ("the broken printer" vs "the boring meeting"), reduced relative ("applicants wishing to apply").
5. Relative pronouns & clauses: who/whom/which/that/what/whose, where/when/why; restrictive vs non-restrictive with commas.
6. Conjunctions & prepositions: despite / in spite of + N/V-ing vs although + clause; because of / due to / owing to + noun; between vs among; during vs while; regarding/concerning/prior to/in accordance with.
7. Pronouns & determiners: other/another/others/the other; each/every; either/neither/both; much/many/a few/a little; reflexive pronouns.
8. To-infinitive vs gerund: verbs + to-V (agree, decide, expect, promise, plan) vs + V-ing (avoid, enjoy, consider, suggest, finish, mind) vs both with meaning change (remember/stop/try).
9. Conditionals & subjunctive: type 0/1/2/3, mixed, inverted ("Had the manager known..."), "require/request/insist + (that) + base verb".
10. Comparatives/superlatives & degree: more/most, -er/-est, as...as, twice as...as, by far/the most, much/far + comparative.
11. Articles & countability: a/an/the/zero article; countable vs uncountable (information/equipment/furniture/advice + singular verb); some/any/no.
12. Word order & adverb placement: frequency adverbs, "not only...but also", inversion after negatives (Never has...).
13. Noun clauses & reported speech: that/what/whether/if clauses; "informed that", "asked whether".
14. Parallel structure: X, Y, and Z in the same form (gerunds, infinitives, nouns).

B. VOCABULARY & PHRASES (ETS business core — rotate, prefer high-frequency exam words):
1. Collocations verb+noun: sign/conduct a review, meet/miss a deadline, draw/attract attention, take responsibility, place/submit an order, hold/conduct a meeting, launch a product, file a complaint, reach an agreement, break a record.
2. Collocations adj+noun & prep+noun: strong demand, keen interest, strict deadline, prompt reply, prior experience, in charge of, responsible for, eligible for, familiar with, capable of, aware of, prior to, pursuant to.
3. Phrasal verbs (most tested in TOEIC): carry out, set up, put off (= postpone), take over, follow up, look into, run into, turn down, bring up, call off, lay off, fill in/out, hand in, go over, keep up with, cut back on, drop by, check in/out.
4. Confusable pairs (Hard favorite): affect/effect, rise/raise/arise, assure/ensure/insure, principal/principle, compliment/complement, economic/economical, historic/historical, sensible/sensitive, efficient/effective, eminent/imminent, stationary/stationery, personal/personnel, Lose/loose, accept/except, adapt/adopt, expand/expend.
5. Fixed business phrases: in accordance with, as opposed to, with regard to, in lieu of, on behalf of, no later than, ahead of schedule, behind schedule, out of stock, free of charge, under warranty, subject to approval.
6. Domain terms: invoice, shipment, warranty, agenda, brochure, merger, procurement, inventory, reimbursement, turnover, deficit, surplus, deadline, quotation/quote, consignment, liaison, apprentice, trainee, keynote.

C. WORD FORMS (suffix map — all 4 options share the same root):
- Noun: -tion/-sion (decision, revision), -ment (management), -ness (awareness), -ity (productivity), -ance/-ence (attendance, dependence), -ship (leadership).
- Verb: -ize/-ise (finalize, organize), -en (strengthen, widen).
- Adjective: -ive (productive), -ous (advantageous), -ful (helpful), -able/-ible (reliable), -al (operational), -ic (economic).
- Adverb: -ly (efficiently, promptly). Test noun vs adjective vs adverb slots: "___ decision" (adjective), "make a ___" (noun), "work ___" (adverb).

D. SENTENCE structures (vary across batch):
- Simple with prep phrase opener ("In response to..., ..."); compound with and/but/so; complex with because/if/when/although/while; relative-clause embedded; participial opener ("Having finished..., ..."); passive main clause; conditional sentence.

## DIFFICULTY DEFINITIONS — PART 5 (kept explicitly, ETS score bands)

### Easy (≈ TOEIC 350-550)
- Sentence: 10-14 words, one clause, clue directly next to the blank.
- Grammar topics: basic prepositions (in/on/at/by/for), simple tense (present vs past), basic articles (a/an/the), simple pronouns.
- Vocabulary topics: common business words (meeting, schedule, budget, report, shipment, attached). Distractors unrelated in meaning.
- Word Forms topics: obvious derivations (manage → management, decide → decision, employ → employment).
- Options: short (1-2 words). Distractors clearly wrong to anyone knowing the rule.

### Medium (≈ TOEIC 550-750)
- Sentence: 14-20 words, two clauses or phrase + main clause; must read the whole sentence.
- Grammar topics: subject-verb agreement, relative pronouns (who/which/that), gerund vs infinitive, passive voice, comparatives/superlatives, conditionals type 1-2, conjunctions (although/despite/because of).
- Vocabulary topics: collocations (conduct a review, meet a deadline), phrasal verbs (carry out, set up, follow up, put off), prep phrases (in charge of, prior to). At least one distractor plausible in general English but WRONG here.
- Word Forms topics: less obvious (produce → productive → productivity, compete → competitive → competitiveness, efficient → efficiency).
- Options: 1-3 words, same POS, similar length.

### Hard (≈ TOEIC 750-990)
- Sentence: 18-25 words with subordinate or reduced clause; tests nuance and traps.
- Grammar topics: parallel structure, agreement with intervening phrase, mixed/inverted conditionals, noun clauses, participial phrases, preposition + gerund traps, subjunctive (require that + base verb).
- Vocabulary topics: confusables (affect/effect, principal/principle, rise/raise), advanced terms (acquisition, restructuring, procurement, compliance, turnover), fixed phrases (in accordance with, subject to, no later than). Multiple distractors plausible.
- Word Forms topics: subtle (economic vs economical, historic vs historical, sensible vs sensitive, effective vs efficient).
- Options: 1-3 words, highly similar; distractors differ by one suffix or one collocate word.

Distribute difficulties evenly: ~1/3 Easy, ~1/3 Medium, ~1/3 Hard (round as needed). IDs: sequential strings 'q1', 'q2', ...

## QUESTION CREATION PROCESS (MANDATORY)

Step 1 — Create 4 COMPLETELY DIFFERENT options first (same POS, similar length, one clearly correct for the target rule).
Step 2 — Choose the correct answer index (0-3), respecting the answer-balance rule.
Step 3 — Write the sentence with '_______' so ONLY the correct option fits grammatically AND collocationally.
Step 4 — Self-check: substitute EACH distractor into the blank and confirm it is ungrammatical or unnatural. If two options both fit, discard and restart.
Step 5 — Write Vietnamese translation + explanation (explain the rule + why each distractor fails).

DO NOT write the sentence first and then invent options. Options MUST come first.

## EXAMPLES (follow this quality bar)

### Easy — Grammar (Preposition / deadline)
Options: ["in", "on", "at", "by"]
Sentence: "Please submit the expense report _______ Friday afternoon."
Correct: "by" (index 3)

### Medium — Vocabulary (Collocation, CORRECT usage)
Options: ["conduct", "make", "take", "have"]
Sentence: "The HR department will _______ a thorough review of all applications before Friday."
Correct: "conduct" (index 0)
Why: "conduct a review" is the standard business collocation; "make/take/have a review" are unnatural here.

### Hard — Grammar (Parallel structure)
Options: ["to finalize", "finalizing", "for finalizing", "the finalization"]
Sentence: "The project manager's responsibilities include coordinating team meetings, _______ client proposals, and overseeing the budget."
Correct: "finalizing" (index 1)
Why: parallel gerunds after "include": coordinating / finalizing / overseeing.

### Hard — Word Forms (same root)
Options: ["economical", "economic", "economy", "economize"]
Sentence: "The recent _______ downturn has forced many retailers to reduce operating costs."
Correct: "economic" (index 1)
Why: "economic" (relating to the economy) modifies "downturn"; "economical" = thrifty, wrong here.

## OUTPUT FORMAT

Return valid JSON only, no markdown fences, no extra text:
{
  "questions": [
    {
      "id": "q1",
      "question": "sentence with _______ blank",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": 0,
      "translation": "Bản dịch tiếng Việt của câu hỏi",
      "explanation": "Chi tiết giải thích bằng tiếng Việt: tại sao đáp án đúng và tại sao mỗi đáp án sai là sai",
      "category": "Grammar" | "Vocabulary" | "Word Forms",
      "difficulty": "Easy" | "Medium" | "Hard"
    }
  ]
}`;
}

export function buildPart6Prompt(count) {
  return `You are an expert TOEIC test writer for ETS. Generate exactly ${count} TOEIC Part 6 (Text Completion, official questions 131-146) passages that match the difficulty and style of official TOEIC exams.

## OFFICIAL FORMAT GROUNDING (MUST FOLLOW)

- Real Part 6 = 4 passages x 4 blanks = 16 questions (Q131-146). You are generating ${count} passage(s) in this batch.
- Passage types (rotate, formal business register): business email (with To/From/Date/Subject header), memo, announcement/notice, advertisement, newsletter excerpt, job posting, instructions/guidelines, internal message.
- Length per passage: 130-200 words (real exam range). Include realistic headers for emails/memos, e.g.
  To: All staff / From: HR Department / Date: March 4 / Subject: Office relocation
- Tone: formal, polite, professional. International business English, no slang. Question text and options are 100% ENGLISH; Vietnamese only in translation/explanation.
- Blank marking: each blank appears in the text as '_______ [NNN]' where NNN is the official-style number. Number blanks SEQUENTIALLY starting at 131 across the whole batch: passage 1 uses [131], [132], [133], [134]; passage 2 uses [135], [136], [137], [138]; passage 3 uses [139], [140], [141], [142], and so on. Each passage contains EXACTLY 4 blanks. Never reuse or skip a number.
- IDs: passages use 'p6-p1', 'p6-p2', etc. Questions use 'p6-p1-q1', 'p6-p1-q2', etc.

## CATEGORY COVERAGE PER PASSAGE (MANDATORY)

Each passage's 4 questions must cover ALL categories: at least 1 Grammar, at least 1 Vocabulary, at least 1 Word Forms, and exactly 1 Sentence Insertion.

## FULL ETS COVERAGE BANK — PART 6 (rotate; every passage must feel like a real office document)

A. TEXT structures (use the authentic skeleton of each type):
- Email: To / From / Date / Subject header + greeting (Dear Mr. Lee,) + purpose line ("I am writing to inform...") + 2-3 detail paragraphs + call to action ("Please confirm by...") + closing (Best regards, + name/title).
- Memo: To / From / Date / Re header + concise bullet-like paragraphs, no greeting.
- Announcement/Notice: title line + effective date + what/where/when + what to do + contact.
- Advertisement: headline + features (2-3 benefits) + offer/deadline + contact/location.
- Instructions: numbered or sequenced steps with imperatives and transitions (first, next, finally).
- Job posting: position + responsibilities + requirements + how to apply + deadline.

B. GRAMMAR in context (test across sentences, not isolated):
- Tense chains: past announcement → present result → future action ("was launched... has received... will expand").
- Passive in formal notices ("All visitors are required to...", "Applications must be submitted...").
- Agreement with collective/intervening nouns; relative clauses linking sentences ("...a system which tracks...").
- Conjunctions/prepositions for logic: despite/in spite of, due to/because of, regarding/concerning, prior to/following, in addition to/besides.
- To-V vs V-ing after key verbs: expect/plan/agree + to-V; suggest/recommend/consider + V-ing; "be responsible for + V-ing", "be eligible to + V".
- Articles/determiners: "a new branch" (first mention) → "the branch" (second mention); other/another/others.

C. VOCABULARY & PHRASES (high-frequency Part 6):
- Transitions & connectors: however, therefore, moreover, furthermore, consequently, meanwhile, otherwise, instead, in fact, as a result, for instance.
- Collocations: meet/miss a deadline, draw attention, take responsibility, place an order, launch a campaign, file a report, hold a seminar, extend an invitation, express appreciation.
- Phrasal verbs: set up, carry out, put off, follow up, look forward to, take part in, run out of, drop in, check out.
- Fixed phrases: be in charge of, prior to, no later than, ahead of/behind schedule, free of charge, under construction, out of order, on behalf of.
- Confusables: affect/effect, ensure/insure, rise/raise, principal/principle, adapt/adopt, expand/expend, compliment/complement.

D. WORD FORMS: 4 options share the same root, different POS (e.g. ["efficient", "efficiency", "efficiently", "efficiencies"], ["approve", "approval", "approving", "approved"]).

E. SENTENCE INSERTION functions (vary the function + position across passages, not always last blank):
1. Topic/purpose bridge: general purpose sentence between announcement and detail list ("This initiative aims to...").
2. Transitional: "However, ..." / "Despite this, ..." signaling contrast with previous sentence.
3. Supporting detail with pronoun tie: "It will be held..." (It = previously named event), "They offer..." (They = previously named company).
4. Call to action: "Please register by Friday using the attached form." (only fits before/after a deadline mention).
5. Concluding: "We appreciate your cooperation and look forward to...".
- Correct sentence has a clean cohesive tie (pronoun antecedent, repeated keyword, logical connector). Each distractor breaks exactly one tie (no antecedent / wrong tense / illogical transition / wrong tone).

## DIFFICULTY DEFINITIONS — PART 6 (kept explicitly, whole-passage level; vary across batch)

### Easy (≈ TOEIC 350-550)
- Passage: 130-150 words, simple sentences. Context clue in the SAME sentence as the blank.
- Grammar topics: basic tense, prepositions, articles.
- Vocabulary topics: common words (schedule, shipment, attached, agenda, reminder, confirm). Distractors unrelated.
- Word Forms topics: obvious derivations (manage → management, inform → information).
- Sentence Insertion: only one option on-topic; others clearly off-topic.

### Medium (≈ TOEIC 550-750)
- Passage: 150-180 words, mix of simple + complex sentences. At least one blank needs the PREVIOUS or NEXT sentence (pronoun, tense chain, collocation across sentences).
- Grammar topics: agreement, relative clauses, gerund vs infinitive, passive, conjunctions (although/despite/due to).
- Vocabulary topics: phrasal verbs (set up, carry out, follow up), collocations (meet a deadline, take responsibility), transitions (however/therefore/moreover).
- Word Forms topics: less obvious (efficient → efficiency, approve → approval, compete → competitive).
- Sentence Insertion: requires following paragraph flow; two options on-topic but only one connects logically.

### Hard (≈ TOEIC 750-990)
- Passage: 170-200 words with subordinate/reduced clauses. Blanks may be interdependent (tense set in blank 1 constrains blank 3).
- Grammar topics: parallel structure, advanced conditionals, noun clauses, participial phrases, subjunctive ("it is essential that + base verb").
- Vocabulary topics: confusables (economic/economical, affect/effect, ensure/insure), advanced terms (renovation, compliance, acquisition), subtle transitions (nevertheless, consequently, in contrast).
- Word Forms topics: subtle (economic vs economical, historic vs historical, considerate vs considerable).
- Sentence Insertion: all 4 options on-topic; only one has correct reference + logic + tone.

## QUESTION CREATION PROCESS (MANDATORY)

Step 1 — Write the COMPLETE passage FIRST with all 4 blanks placed naturally (vary positions; do not cluster all blanks in one paragraph).
Step 2 — For EACH non-insertion blank, create 4 options: same POS, similar length, only one fits grammar + collocation + context. Substitute-test every distractor.
Step 3 — For the insertion blank, write the CORRECT sentence first (with cohesive tie), then 3 distractors breaking one tie each.
Step 4 — Choose correctAnswer index per blank; balance 0-3 across the batch, never 3 in a row identical.
Step 5 — Verify numbering [131]... sequential with no gaps, each blank referenced by exactly one question in order.

## OPTIONS GUIDELINES

- Same part of speech per blank (except insertion). Similar length. NO duplicates or double-acceptable answers.
- Distractors plausible in business English generally, but clearly wrong HERE (wrong tense for the timeline, wrong preposition, wrong register).
- Insertion options: 12-22 words each, formal tone, ending with period.

## EXAMPLES (quality bar)

### Easy — Vocabulary (email)
Passage: "To: All employees\\nFrom: Facilities Team\\nSubject: Parking lot maintenance\\nDear employees, please note that the north parking lot will be closed for maintenance from June 2 to June 4. Please park in the south lot during this period. We _______ [131] your cooperation."
Options: ["appreciate", "increase", "announce", "estimate"]
Correct: "appreciate" (index 0). Distractors are real verbs but collocationally wrong with "your cooperation".

### Medium — Grammar / Word Forms (same root)
Passage: "...The new inventory system was _______ [132] by the logistics team over the past month."
Options: ["implemented", "implement", "implementing", "implementation"]
Correct: "implemented" (index 0, passive was + past participle).

### Hard — Sentence Insertion
Passage: "We are pleased to announce our new employee wellness program, effective January 1st. _______ [133] The program includes gym subsidies, weekly yoga, and counseling services."
Options: [
  "This initiative aims to promote a healthier work-life balance among our staff.",
  "The gym subsidies are available to all full-time employees.",
  "Weekly yoga sessions will be held every Wednesday at noon.",
  "Counseling services are provided by licensed professionals."
]
Correct: index 0 — general PURPOSE sentence bridging announcement → detail list.

## OUTPUT FORMAT

Return valid JSON only, no markdown fences, no extra text:
{
  "passages": [
    {
      "id": "p6-p1",
      "text": "Passage text with _______, [131], [132], [133], [134] blanks (numbers sequential, exactly 4 per passage)",
      "translation": "Bản dịch tiếng Việt chi tiết của toàn bộ đoạn văn",
      "questions": [
        {
          "id": "p6-p1-q1",
          "questionNumber": 1,
          "options": ["option1", "option2", "option3", "option4"],
          "correctAnswer": 0,
          "explanation": "Chi tiết giải thích bằng tiếng Việt: tại sao đáp án đúng và tại sao mỗi đáp án sai là sai",
          "category": "Grammar" | "Vocabulary" | "Word Forms" | "Sentence Insertion"
        }
      ]
    }
  ]
}`;
}

export function buildPart7Prompt(passageType, count, startQuestionNumber) {
  return `You are an expert TOEIC test writer for ETS. Generate exactly ${count} TOEIC Part 7 (Reading Comprehension, official questions 147-200) ${passageType} Passage(s) that match the difficulty and style of official TOEIC exams.
Start numbering questions from ${startQuestionNumber}.

## OFFICIAL FORMAT GROUNDING (MUST FOLLOW — this is what makes it look like the real exam)

- Real Part 7 = 54 questions (Q147-200):
  - Single Passage: ~10 sets, Q147-175, each set = 1 document + 2-4 questions (mostly 3).
  - Double Passage: 2 sets, Q176-185, each set = 2 related documents + EXACTLY 5 questions.
  - Triple Passage: 3 sets, Q186-200, each set = 3 related documents + EXACTLY 5 questions.
- You are generating ${count} ${passageType} set(s). Question numbers MUST be sequential across the whole batch starting at ${startQuestionNumber} with NO gaps and NO repeats. Example: Single, count=2, start=147, 3 questions each → set 1 = Q147-149, set 2 = Q150-152. Double/Triple: each set consumes exactly 5 numbers (e.g. start=176 → Q176-180, next set Q181-185).
- Two documents in one set must share a topic but come from DIFFERENT sources/perspectives (e.g. company announcement vs customer email about it). Names, dates, prices, reference numbers MUST be consistent across documents (same spelling, same figures) — like the real exam where cross-document traps hinge on exact matching.
- Special formats (use where natural, exactly like the real test):
  - Online chat / message chain: "Name [9:42 A.M.] message text" per line, 3-5 exchanges.
  - Table/schedule/form: plain-text rows with consistent columns (e.g. "Flight | Departure | Arrival | Gate").
  - Headers: emails/letters/memos include To/From/Date/Subject or Dear/Sincerely lines.
- All English in passages/questions/options. Vietnamese ONLY in translation/explanation fields.
- For Double/Triple passages, separate documents with HTML structure:
  <div class="passage-part"><h5>Document 1: [Type]</h5><p>...</p></div><hr class="passage-divider"/><div class="passage-part"><h5>Document 2: [Type]</h5><p>...</p></div>
  (Triple: same pattern with Document 3.) Preserve line breaks inside <p> with <br/> where the original document has them. This HTML is required for UI rendering.

## PASSAGE TYPE SPECIFICATIONS

### Single Passage (${passageType === 'Single' ? 'CURRENT — generate this' : 'reference'})
- Length: 150-300 words, exactly 1 document.
- Questions per set: 2-4 (vary across sets in the batch; mostly 3). Total questions in this batch = sum across sets, numbered from ${startQuestionNumber}.
- Document types: Email, Letter, Notice, Advertisement, Article, Webpage, Newsletter, Form, Schedule.

### Double Passage (${passageType === 'Double' ? 'CURRENT — generate this' : 'reference'})
- Length: 200-350 words total (both documents combined), exactly 2 related documents.
- Each set MUST have EXACTLY 5 questions consuming 5 consecutive numbers from ${startQuestionNumber}.
- At least 1 question MUST require comparing information from BOTH documents (e.g. "What did the reviewer misunderstand about the advertisement?", "What will the customer do next according to the email exchange?").
- Separate documents with HTML structure:
  <div class="passage-part"><h5>Document 1: [Type]</h5><p>...</p></div><hr class="passage-divider"/><div class="passage-part"><h5>Document 2: [Type]</h5><p>...</p></div>

### Triple Passage (${passageType === 'Triple' ? 'CURRENT — generate this' : 'reference'})
- Length: 300-500 words total (all three documents combined), exactly 3 related documents.
- Each set MUST have EXACTLY 5 questions consuming 5 consecutive numbers from ${startQuestionNumber}.
- At least 2 questions MUST require synthesizing information from MULTIPLE documents.
- Separate documents with HTML structure similar to Double Passage, using <hr class="passage-divider"/> between documents.

## FULL ETS COVERAGE BANK — PART 7 (every set must sample across these)

A. DOCUMENT structures & phrases (rotate; use authentic skeletons):
- Email/letter: To/From/Date/Subject + Dear... + purpose ("I am writing to.../Please be advised...") + details (dates, amounts, reference No.) + request ("Please confirm/reply by...") + closing (Sincerely/Best regards).
- Notice/announcement: headline + effective date + what/where/when + who is affected + action required + contact.
- Advertisement: headline + 2-3 features + price/offer + validity ("Offer valid until...") + location/contact + fine print.
- Article/newsletter: headline + byline + lead (who/what/when) + quotes + figures (%, $, growth).
- Webpage/coupon: product name + specs + price + "Use code X" + expiry + terms.
- Chat/message chain: Name [time] per turn, informal-but-polite office tone, 3-5 turns resolving an issue (reschedule, delivery, refund).
- Table/form/schedule: rows with consistent columns; questions test lookup + transfer ("At what time does...?", "Which gate...?").

B. QUESTION stems bank (phrase questions like ETS — mix types per set):
1. Main idea / purpose: "What is the main purpose of the notice?" / "Why was the email written?" / "What is the article mainly about?"
2. Explicit detail: "According to the advertisement, what will happen on April 12?" / "What is stated about the refund policy?"
3. NOT question: "Which of the following is NOT mentioned as...?" / "Which service is NOT offered?"
4. Inference: "What can be inferred about Mr. Park?" / "What is most likely true about the company?" (connect 2 facts).
5. Vocabulary in context: "The word 'renowned' in paragraph 2, line 4 is closest in meaning to..." (4 options same POS: famous / infamous / unknown / ordinary).
6. Reference: "The word 'it' in paragraph 1, line 3 refers to..." (pronoun antecedent — real ETS favorite).
7. Cross-document / transfer: "What does Ms. Lee's reply indicate about the schedule?" / "How do the two documents differ regarding the delivery date?" / "What will the customer most likely do next?"
8. Tone / intention / sequence: "What is the tone of the message?" / "What does the author intend by...?" / "What should attendees do before Friday?"
- Per Single set: 2-3 types; per Double/Triple set: 4-6 types. Sets with 3+ questions include at least one vocabulary-in-context OR inference OR reference question.

C. VOCABULARY & SENTENCE patterns in passages (keep exam-realistic):
- Sentences: simple notices ("The lobby will be closed on..."), compound ("...and.../but..."), complex with because/if/when/although/while ("Although construction is ongoing, ..."), passive formal ("All applicants are required to..."), conditional ("If you purchased before May 1, you are eligible..."), reduced clauses ("Employees wishing to attend must...").
- Business phrases recurring in real Part 7: be eligible for, prior to, no later than, ahead of/behind schedule, free of charge, out of stock, under warranty, subject to, as scheduled, until further notice, feel free to contact, we regret to inform, be pleased to announce, attached please find.
- Numbers as traps: dates (April 12 vs 21), times (9:30 A.M. vs P.M.), prices ($50 vs $15), quantities (first 50 visitors), reference numbers — distractors twist exactly one digit/word.

## DIFFICULTY DEFINITIONS — PART 7 (kept explicitly; vary across sets in the batch)

### Easy (≈ TOEIC 350-550)
- Passage: straightforward sentences, minimal subordination. Facts stated explicitly in one place.
- Questions: main idea, explicit detail ("According to..."). Vocabulary: common synonyms (buy → purchase, fast → prompt).
- Options: distractors clearly contradicted by a keyword in the text.

### Medium (≈ TOEIC 550-750)
- Passage: mix of simple + complex sentences. Some paraphrase between passage and correct option (passage "free coffee for early visitors" → option "complimentary beverage").
- Questions: purpose, cause-effect, tone, reference ("it" refers to...), single-document inference.
- Options: plausible, differ by one detail (wrong date/price/name); need careful reading.

### Hard (≈ TOEIC 750-990)
- Passage: complex sentences with subordination; facts spread across paragraphs/documents.
- Questions: NOT questions, multi-hop inference, cross-document synthesis, logical sequence/next step. Vocabulary: subtle shades (renowned vs notorious, adjacent vs adjoining, tentative vs temporary).
- Options: multiple distractors reuse passage wording — only ONE fully supported; others twist a number, mix documents, or state plausible-but-unstated outside knowledge.

## OPTIONS RULES (real-exam traps)

- 4 options (A-D), each 5-18 words, similar length and grammar. NO "all of the above", NO "none of the above".
- Correct answer: fully supported (directly or via one clean inference step). Paraphrase passage wording (real TOEIC rarely copies verbatim).
- Distractors from the ETS trap playbook: (a) true statement but answers the WRONG question; (b) same keywords with twisted detail (April 12 → 21, $50 → $15, Mr. Kim → Mr. Park); (c) mixes Document 1 detail into a Document 2 question (Double/Triple); (d) plausible outside knowledge NOT stated.
- Vocabulary questions: 4 options same POS, one true synonym in context.

## QUESTION CREATION PROCESS (MANDATORY)

Step 1 — Write the COMPLETE document(s) first with all facts (who/what/when/where/how much/reference numbers) fixed and consistent.
Step 2 — For EACH question, write the correct answer FIRST (paraphrased, fully supported), then the question stem, then 3 distractors from the trap playbook above.
Step 3 — Choose correctAnswer index (0-3); balance across the batch (~25% each), never 3 identical in a row.
Step 4 — Verify: (a) every question answerable from the text alone, no outside knowledge; (b) each distractor contradicted by or unsupported by the text; (c) question numbers sequential from ${startQuestionNumber} with no gaps; (d) Double = exactly 5/set with ≥1 cross-document, Triple = exactly 5/set with ≥2 cross-document.

DO NOT write questions before the passage is complete. The passage MUST exist first.

## EXAMPLES (quality bar — note paraphrase + twisted-detail traps)

### Single Passage — Easy
Document Type: Email
"Subject: 3rd-floor renovation — temporary relocation
Dear Team,
Please be informed that the 3rd-floor renovation will begin on Monday, March 10. From March 10 to April 5, staff based on the 3rd floor will work temporarily on the 5th floor. Please remove personal items from your desks by Friday, March 7. For questions, contact facilities@meridian.com.
Best regards, Office Management"

Question: "What is the main purpose of this email?"
Options: [
  "To announce a temporary relocation due to renovation work",
  "To introduce new staff members on the 5th floor",
  "To explain the company's new remote-work policy",
  "To request feedback on renovation plans"
]
Correct: 0 (paraphrase of explicit facts; B/C/D use passage words but state unstated facts).

### Double Passage — Medium (cross-document trap)
Document 1 (Advertisement): "Grand opening: GreenLeaf Cafe, April 12, 45 Oak Street. Organic, locally sourced lunch sets. First 50 visitors receive a free coffee."
Document 2 (Review): "Visited GreenLeaf last week. Friendly staff, but portions were small for the price. I would return only if prices drop."

Question: "How does the reviewer's experience compare to the advertised image?"
Options: [
  "The reviewer found the food overpriced relative to its quality",
  "The reviewer praised the cafe as the best organic restaurant in town",
  "The reviewer complained about unfriendly service",
  "The reviewer plans to attend the April 12 grand opening"
]
Correct: 0 (B contradicts, C inverts "friendly", D twists timeline).

## OUTPUT FORMAT

Return valid JSON only, no markdown fences, no extra text:
{
  "passages": [
    {
      "id": "p7-p-${passageType.toLowerCase()}-1",
      "passageType": "${passageType}",
      "documentType": "string (e.g., Email, Notice, Advertisement)",
      "text": "Passage text. For Double/Triple, use HTML structure as specified.",
      "translation": "Bản dịch tiếng Việt chi tiết của toàn bộ tài liệu",
      "questions": [
        {
          "id": "p7-q-${startQuestionNumber}",
          "questionNumber": ${startQuestionNumber},
          "question": "Question in English",
          "options": ["option1", "option2", "option3", "option4"],
          "correctAnswer": 0,
          "explanation": "Chi tiết giải thích bằng tiếng Việt: tại sao đáp án đúng và tại sao mỗi đáp án sai là sai",
          "translation": "Dịch câu hỏi và 4 lựa chọn sang tiếng Việt"
        }
      ]
    }
  ]
}`;
}
