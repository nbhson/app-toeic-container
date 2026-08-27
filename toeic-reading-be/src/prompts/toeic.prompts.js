/**
 * Prompt templates for TOEIC question generation.
 * Moved from the Angular UI's OmnirouteService to the backend.
 */

export function buildPart5Prompt(count) {
  return `You are an expert TOEIC test writer for ETS. Generate exactly ${count} TOEIC Part 5 (Incomplete Sentences) questions that match the difficulty and style of official TOEIC exams.

## RULES

- All questions must be set in a BUSINESS/WORKPLACE context (office, HR, finance, marketing, logistics, manufacturing, customer service, etc.).
- Each question is a single English sentence with one blank marked '_______'.
- Distribute categories evenly across the batch: Grammar, Vocabulary, Word Forms.
- Distribute difficulties evenly: approximately 1/3 Easy, 1/3 Medium, 1/3 Hard (round as needed).
- IDs: sequential strings 'q1', 'q2', ...

## DIFFICULTY DEFINITIONS

### Easy
- Short sentence (8-12 words).
- Blank tests ONE basic, common knowledge point.
- Options are short (1-2 words each).
- Distractors are clearly wrong to someone who knows the rule.
Grammar topics: basic prepositions (in/on/at/by), simple tense (past vs present), basic articles (a/an/the).
Vocabulary topics: common business words (meeting, schedule, budget, report).
Word Forms topics: obvious derivations (manage → management, decide → decision).

### Medium
- Medium sentence (12-18 words).
- Blank tests knowledge that requires understanding context or collocations.
- Options are 1-3 words. At least one distractor is plausible.
Grammar topics: subject-verb agreement, relative pronouns (which/who/that), gerund vs infinitive, comparatives/superlatives, conditionals (if-clauses).
Vocabulary topics: phrasal verbs (carry out, set up, follow up), collocations (make a decision, reach an agreement), business-specific terms.
Word Forms topics: less obvious derivations (product → productive → productivity), adjective/noun confusion.

### Hard
- Long sentence (18-25 words) with subordinate clauses or complex structure.
- Blank tests nuanced grammar or vocabulary that traps test-takers.
- Options are 2-4 words. Multiple distractors are plausible.
Grammar topics: parallel structure, subject-verb agreement with intervening phrases, advanced conditionals (mixed/inverted), noun clauses, passive voice in complex sentences.
Vocabulary topics: easily confused words (affect/effect, principal/principle), advanced business vocabulary (acquisition, restructuring, procurement), idiomatic expressions.
Word Forms topics: words where form change is subtle or context-dependent (e.g., economic vs economical, sensible vs sensitive).

## QUESTION CREATION PROCESS (MANDATORY)

Step 1 — Create 4 COMPLETELY DIFFERENT options first. Each option must be grammatically and semantically distinct. NO duplicates or near-synonyms.
Step 2 — Choose the correct answer index (0-3).
Step 3 — Write the sentence with the blank, ensuring the correct option fits perfectly and naturally.
Step 4 — Write a plausible distractor explanation for each wrong answer.

DO NOT write the sentence first and then invent options. Options MUST come first.

## OPTIONS GUIDELINES

- All 4 options must be different in meaning and word choice.
- Wrong answers must be plausible in a business context but clearly wrong for THIS specific sentence (wrong grammar, wrong meaning, or wrong collocation).
- Position of blank varies: sometimes at the end, sometimes in the middle, sometimes near the beginning.

## EXAMPLES

### Easy — Grammar (Preposition)
Options: ["in", "on", "at", "by"]
Sentence: "Please submit the report _______ the end of business today."
Correct: "by" (index 3)
Explanation: "By" indicates a deadline. "In the end" is not used with specific time frames. "On the end" and "at the end of business today" — "at" is close but "by" is the standard preposition for deadlines in business English."

### Medium — Vocabulary (Collocation)
Options: ["make", "do", "take", "have"]
Sentence: "We need to _______ a thorough review of the quarterly expenses before the meeting."
Correct: "make" (index 0)
Explanation: "Make a review" is the correct collocation. "Do a review" is less formal and less common in business writing. "Take a review" and "have a review" are not standard collocations."

### Hard — Grammar (Parallel Structure)
Options: ["to finalize", "finalizing", "for finalizing", "the finalization"]
Sentence: "The project manager's responsibilities include coordinating team meetings, _______ client proposals, and overseeing the budget."
Correct: "finalizing" (index 1)
Explanation: "Finalizing" maintains parallel structure with "coordinating" and "overseeing" (all gerunds after "include"). "To finalize" breaks parallelism. "For finalizing" and "the finalization" are grammatically incorrect in this context."

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
  return `You are an expert TOEIC test writer for ETS. Generate exactly ${count} TOEIC Part 6 (Text Completion) passages that match the difficulty and style of official TOEIC exams.

## RULES

- Each passage contains exactly 4 blanks marked [131], [132], [133], [134] (first passage) or [135], [136], [137], [138] (second passage).
- All passages must be set in BUSINESS/WORKPLACE contexts: corporate emails, memos, notices, advertisements, newsletters, internal communications, etc.
- The writing style must be formal and professional, consistent with official TOEIC exams.
- Each passage's 4 questions must cover ALL categories: at least 1 Grammar, at least 1 Vocabulary, at least 1 Word Forms, and exactly 1 Sentence Insertion.
- IDs: passages use 'p6-p1', 'p6-p2', etc. Questions use 'p6-p1-q1', 'p6-p1-q2', etc.

## DIFFICULTY DEFINITIONS

### Easy
- Passage is short (80-120 words) with simple sentence structures.
- Blanks test basic grammar or common vocabulary.
- Context clues are obvious and directly surrounding the blank.
- Sentence Insertion: the sentence clearly and obviously fits one spot.
Grammar topics: basic prepositions, simple tenses, articles.
Vocabulary topics: common business words (schedule, budget, report, meeting).
Word Forms topics: obvious derivations (manage → management).

### Medium
- Passage is medium length (120-180 words) with some complex sentences.
- Blanks require understanding the broader paragraph context, not just the immediate sentence.
- At least one blank tests collocations or phrasal verbs.
- Sentence Insertion: the sentence requires understanding the flow of the passage.
Grammar topics: subject-verb agreement, relative clauses, gerund vs infinitive, passive voice.
Vocabulary topics: phrasal verbs (carry out, set up), collocations (make a decision, reach an agreement), business-specific terms.
Word Forms topics: less obvious derivations (product → productive → productivity).

### Hard
- Passage is long (180-250 words) with multiple subordinate clauses.
- Blanks test nuanced grammar or easily confused vocabulary.
- Multiple blanks may be interdependent — the passage structure matters.
- Sentence Insertion: the sentence fits only in one spot and requires understanding logical flow, not just topic.
Grammar topics: parallel structure, advanced conditionals, noun clauses, participial phrases.
Vocabulary topics: easily confused words (affect/effect, principal/principle), advanced business vocabulary (acquisition, restructuring, procurement).
Word Forms topics: subtle context-dependent forms (economic vs economical, sensible vs sensitive).

## QUESTION CREATION PROCESS (MANDATORY)

Step 1 — Write the complete passage FIRST with all 4 blanks placed naturally.
Step 2 — For EACH blank, create 4 COMPLETELY DIFFERENT options. Options must be grammatically and semantically distinct.
Step 3 — Choose the correct answer index (0-3) for each blank.
Step 4 — Verify each option fits the passage context correctly.

DO NOT write options before the passage is complete, but DO ensure options are created for each blank before finalizing the passage.

## OPTIONS GUIDELINES

- All 4 options for each blank must be different in meaning and word choice.
- Wrong answers must be plausible in the business context but clearly wrong for THIS specific blank (wrong grammar, wrong meaning, wrong collocation, or wrong register).
- For Sentence Insertion: options are 4 different sentences. Only one fits logically and grammatically into the blank position.

## EXAMPLES

### Easy — Vocabulary
Passage: "Dear employees, please note that the annual company picnic will be held on Saturday, August 15th, at Riverside Park. All staff members and their [131] _______ are welcome to attend."
Options: ["families", "friends", "colleagues", "neighbors"]
Correct: "families" (index 0)
Explanation: "Families" is the most appropriate word in this context — company events typically invite employees' families. "Friends" is less formal and less common in corporate communications. "Colleagues" is redundant (employees are already colleagues). "Neighbors" is irrelevant."

### Medium — Grammar (Passive Voice)
Passage: "The quarterly financial report has been completed and will be presented to the board of directors at tomorrow's meeting. The report was [132] _______ by the accounting department over the past three weeks."
Options: ["compiled", "compile", "compiling", "compilation"]
Correct: "compiled" (index 0)
Explanation: "Compiled" is the correct past participle for passive voice construction (was + past participle). "Compile" is the base form and grammatically incorrect after "was." "Compiling" is the present participle and cannot follow "was" in passive voice. "Compilation" is a noun and grammatically incorrect in this position."

### Hard — Sentence Insertion
Passage: "We are pleased to announce the launch of our new employee wellness program, effective January 1st. [133] _______ The program includes gym membership subsidies, weekly yoga sessions, and access to mental health counseling services."
Options: [
  "This initiative aims to promote a healthier work-life balance among our staff.",
  "The gym membership subsidies are available to all full-time employees.",
  "Weekly yoga sessions will be held every Wednesday at noon.",
  "Mental health counseling services are provided by licensed professionals."
]
Correct: "This initiative aims to promote a healthier work-life balance among our staff." (index 0)
Explanation: "This initiative..." logically bridges the announcement of the program and the list of specific features. It explains the PURPOSE before listing DETAILS. The other options jump to specific features without providing the transitional context needed."

## OUTPUT FORMAT

Return valid JSON only, no markdown fences, no extra text:
{
  "passages": [
    {
      "id": "p6-p1",
      "text": "Passage text with [131], [132], [133], [134] blanks",
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
  return `You are an expert TOEIC test writer for ETS. Generate exactly ${count} TOEIC Part 7 (Reading Comprehension) ${passageType} Passage(s) that match the difficulty and style of official TOEIC exams.
Start numbering questions from ${startQuestionNumber}.

## RULES

- All passages must be set in BUSINESS/WORKPLACE contexts: emails, notices, advertisements, articles, newsletters, webpages, chat discussions, etc.
- The writing style must be formal and professional, consistent with official TOEIC exams.
- Question numbering must be sequential starting from ${startQuestionNumber}.

## PASSAGE TYPE SPECIFICATIONS

### Single Passage (${passageType === 'Single' ? 'CURRENT' : 'reference'})
- Length: 150-300 words.
- Contains exactly 1 document.
- Number of questions per passage: 2-4 questions (vary between passages).
- Document types: Email, Notice, Advertisement, Article, Webpage, Newsletter.

### Double Passage (${passageType === 'Double' ? 'CURRENT' : 'reference'})
- Length: 200-350 words total (both documents combined).
- Contains exactly 2 related documents that share a common topic or context.
- Documents must be related but from DIFFERENT sources or perspectives (e.g., an advertisement and a customer review, two emails about the same project, a notice and a response).
- Each passage MUST have EXACTLY 5 questions.
- At least 1 question must require comparing information from BOTH documents.
- Separate documents with HTML structure:
  <div class="passage-part"><h5>Document 1: [Type]</h5><p>...</p></div><hr class="passage-divider"/><div class="passage-part"><h5>Document 2: [Type]</h5><p>...</p></div>

### Triple Passage (${passageType === 'Triple' ? 'CURRENT' : 'reference'})
- Length: 300-500 words total (all three documents combined).
- Contains exactly 3 related documents that share a common topic or context.
- Documents must be related but from DIFFERENT sources or perspectives.
- Each passage MUST have EXACTLY 5 questions.
- At least 2 questions must require comparing information from multiple documents.
- Separate documents with HTML structure similar to Double Passage, using <hr class="passage-divider"/> between documents.

## DIFFICULTY DEFINITIONS

### Easy
- Passage uses straightforward sentence structures with minimal subordinate clauses.
- Information is stated explicitly — answers can be found directly in the text.
- Questions test basic comprehension: main idea, specific details, vocabulary in context.
- Distractors are clearly contradicted by the passage.

### Medium
- Passage uses a mix of simple and complex sentences.
- Some questions require inference or understanding implied meaning.
- Questions test: purpose, attitude, tone, logical conclusion, cause-effect.
- Distractors are plausible but require careful reading to eliminate.

### Hard
- Passage uses complex sentence structures with multiple subordinate clauses.
- Questions require synthesis across multiple parts of the passage (or across documents for Double/Triple).
- Questions test: author's purpose, implication, detailed comparison, logical sequence.
- Multiple distractors are plausible — only ONE is fully supported by the text.

## QUESTION CREATION PROCESS (MANDATORY)

Step 1 — Write the COMPLETE passage/document(s) first with all necessary details.
Step 2 — For EACH question, create 4 COMPLETELY DIFFERENT answer options. Options must be semantically distinct.
Step 3 — Choose the correct answer index (0-3).
Step 4 — Write the question that the correct answer directly addresses.
Step 5 — Verify each wrong answer is contradicted by or unsupported by the passage.

DO NOT write questions before the passage is complete. The passage MUST exist first.

## QUESTION TYPES

Mix these question types across the passage:
- Main Idea: "What is the main purpose of this [email/notice/article]?"
- Specific Detail: "According to the [email/notice], what is the deadline for...?"
- Vocabulary in Context: "The word 'restructuring' in line 3 is closest in meaning to..."
- Inference: "It can be inferred that the author most likely..."
- Purpose: "Why did the author write this [email/notice/article]?"
- Comparison (Double/Triple only): "How do the two/three [documents] differ regarding...?"
- Tone/Attitude: "What is the author's attitude toward...?"

## OPTIONS GUIDELINES

- All 4 options must be different in content and meaning.
- Wrong answers must be grammatically correct but factually wrong based on the passage.
- For Double/Triple passages, some wrong answers may mix up details from different documents.

## EXAMPLES

### Single Passage — Easy
Document Type: Email
"Subject: Office Renovation Schedule
Dear Team,
Please be informed that the 3rd floor renovation will begin on Monday, March 10th. During the renovation period (March 10th - April 5th), all employees currently working on the 3rd floor will be temporarily relocated to the 5th floor. Please collect your personal items from your desks by Friday, March 7th. If you have any questions, contact facilities@company.com.
Best regards, Office Management"

Question: "What is the main purpose of this email?"
Options: [
  "To announce a change in office location for some employees",
  "To introduce new team members joining the company",
  "To explain the company's new remote work policy",
  "To request feedback on office renovation plans"
]
Correct: 0
Explanation: "The email informs 3rd floor employees about temporary relocation due to renovation. Option B is not mentioned. Option C is unrelated — the email is about office renovation, not remote work. Option D is wrong — the email is an announcement, not a request for feedback."

### Double Passage — Medium
Document 1: Advertisement
"Grand Opening: GreenLeaf Cafe
Join us for the grand opening of GreenLeaf Cafe on April 12th! We serve organic, locally-sourced meals. First 50 customers receive a free coffee. Located at 45 Oak Street."

Document 2: Online Review
"I visited GreenLeaf Cafe last week. The food was decent but overpriced for the portion size. The staff was friendly, though. I wouldn't go back unless they lower their prices."

Question: "How does the reviewer's experience compare to the cafe's advertised image?"
Options: [
  "The reviewer found the prices higher than expected for an organic cafe",
  "The reviewer agreed that the cafe serves the best organic food in town",
  "The reviewer was disappointed by the unfriendly staff",
  "The reviewer plans to return for the grand opening event"
]
Correct: 0
Explanation: "The advertisement promotes organic, locally-sourced meals (implying quality), but the reviewer found it overpriced. Option B contradicts the review. Option C is wrong — the reviewer said staff was friendly. Option D is unsupported — the reviewer said they wouldn't return."

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