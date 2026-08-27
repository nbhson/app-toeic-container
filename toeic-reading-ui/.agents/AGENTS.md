# Agentic Workspace Configuration: TOEIC App

This directory contains the workspace configuration, rules, agents, workflows, templates, and knowledge bases for autonomous AI agents collaborating on the TOEIC Practice project.

## 1. Tech Stack & Angular Architecture

We use the latest features in Angular 22+ to ensure high performance and modern code practices.
For full details on our stack, components, state management, and declarative data loading, please see:
[.agents/knowledge/frontend-architecture.md](file:///Users/nguyenson/Github/toeic/.agents/knowledge/frontend-architecture.md).

---

## 2. Context and Search Exclusions

- **Exclusion Rules**: Agents must strictly respect `.gitignore` and `.aiexclude` configurations.
- **Search Restrictions**: When running search tools (`grep_search`, `list_dir`) or terminal search commands, you must exclude ignored directories (such as `dist/`, `node_modules/`, `.git/`, and `.agents/`) to prevent processing compiled code or system logs, unless the user explicitly specifies an excluded directory path in their prompt.
- **Search Exclusions**: When executing any shell command to search or list files (e.g., `find`, `grep`, `ls`), you MUST explicitly add ignore/exclude parameters for directories like `dist/`, `node_modules/`, `.git/`, and `.agents/`.

---

## 3. Orchestration Workflow

You are operating inside an Enterprise Engineering System. You MUST NOT immediately start implementation. Always follow these sequential steps to route the request:

### Step 1 — Classify Request

Map the request type to a workflow:

- **Jira Ticket ID / Key** -> `jira-review` (Start here to retrieve and analyze ticket details before starting development)
- **New Feature** -> `feature-delivery`
- **Bug Fix** -> `bug-fix`
- **Refactor** -> `refactor`
- **Code Review** -> `code-review`

_If uncertain, ask clarifying questions instead of guessing._

### Step 2 — Load Workflow

Load the primary execution plan from:

```text
.agents/workflows/<workflow>.md
```

_Once the specific workflow is loaded, follow its internal instructions exclusively. The workflow will dictate which specific rules, knowledge base files, templates, and execution steps you need to execute for that request type._

---

## 4. Agent Orchestration Framework Overview

```mermaid
flowchart TD

    %% =========================
    %% Request Entry
    %% =========================

    Request[Developer Request]
    Decision{Request Type}

    Request --> Decision

    Decision -->|Jira Ticket Review| JiraReviewWF[Jira Review Workflow]
    Decision -->|Feature Delivery| FeatureWF[Feature Delivery Workflow]
    Decision -->|Bug Fix| BugFixWF[Bug Fix Workflow]
    Decision -->|Refactor| RefactorWF[Refactor Workflow]
    Decision -->|Code Review| CodeReviewWF[Code Review Workflow]

    %% =========================
    %% Understanding Phase
    %% =========================

    subgraph Phase1["Phase 1 - Understanding"]
        LoadKnowledge[Load Knowledge]
        Investigation[Investigation]
        ApplyRules[Apply Rules]

        LoadKnowledge --> Investigation
        Investigation --> ApplyRules
    end

    JiraReviewWF --> LoadKnowledge
    FeatureWF --> LoadKnowledge
    BugFixWF --> LoadKnowledge
    RefactorWF --> LoadKnowledge

    %% =========================
    %% Planning Phase
    %% =========================

    subgraph Phase2["Phase 2 - Planning"]
        Plan[Implementation Plan]
        Approval{Approval Gate}
        Refine[Refine Plan]

        Plan --> Approval
        Approval -->|Rejected| Refine
        Refine --> Plan
    end

    ApplyRules --> Plan

    %% =========================
    %% Execution Phase
    %% =========================

    subgraph Phase3["Phase 3 - Execution"]
        TaskList[Create Task List]
        ExecuteTasks[Execute Tasks]
        UnitTest[Unit Test]
        UpdateStatus[Update Task Status]
        Output[Generate Engineering Report]

        TaskList --> ExecuteTasks
        ExecuteTasks --> UnitTest
        UnitTest --> UpdateStatus
        UpdateStatus --> Output
    end

    Approval -->|Approved| TaskList

    %% =========================
    %% Review & Delivery Phase
    %% =========================

    subgraph Phase4["Phase 4 - Review & Delivery"]
        Reviewer[Reviewer]
        RunHooks[Run Pre-PR Hook & Create PR]
        Report[Final PR & Completed Report]

        RunHooks --> Report
    end

    CodeReviewWF --> Reviewer

    Output --> RunHooks
    Reviewer --> RunHooks
```
