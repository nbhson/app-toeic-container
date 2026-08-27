---
name: angular-architecture
description: Guides creating standalone components, presenting child sub-components, and handling Angular Signals state (inputs, outputs, resource, computed) in the TOEIC application.
---

# Angular Architecture & Component Blueprint

This skill guides you on how to construct, split, and manage Angular components in this repository.

## 1. Container vs. Presentation Pattern

When a feature screen grows beyond 200 lines of template or SCSS:

1. **Parent (Container)**:
   - File: `practice-partX.component.ts`
   - Role: Orchestrates data loading via `resource()`, manages URL routing/navigation, coordinates submissions, handles confirm guards, and maintains global state.
   - Example markup:
     ```html
     <div class="practice-main-grid">
       <app-passage-content [passage]="currentPassage()" (gapClicked)="onScroll($event)" />
       <app-question-list
         [questions]="currentPassage().questions"
         (selectOption)="onSelect($event)"
       />
     </div>
     ```
2. **Children (Presenters)**:
   - Folder: `components/my-sub-component/`
   - Role: Stateless rendering. Receives inputs via `input<T>()` or `input.required<T>()`, emits actions via `output<T>()`.
   - Rules:
     - No direct service injection (e.g., `inject(ToeicService)`) inside presenters.
     - Add `changeDetection: ChangeDetectionStrategy.OnPush` to every presenter.

## 2. Signals & Resource Loading Guidelines

Always write data loading declaratively:

```typescript
// Good: Declarative API resource
readonly itemsResource = resource({
  request: () => this.mySignalDependency(),
  loader: async ({ request }) => {
    return await this.myService.loadData(request);
  }
});

// Derived states:
readonly items = computed(() => this.itemsResource.value() || []);
readonly isLoading = this.itemsResource.isLoading;
```

**State mutations**:

- Writable state: Use `signal<T>(initial)`.
- Derived read-only state: Always use `computed()`.
- Avoid triggering signals inside `effect()` unless wrapped in `untracked()` or performing side-effects (e.g., saving to local storage).

## 3. Template Code Blueprint

Use standalone components without `CommonModule`. Use modern control flow:

```html
<!-- my-component.component.html -->
@if (isLoading()) {
<div class="shimmer-card">...</div>
} @else if (items().length > 0) {
<div class="items-grid">
  @for (item of items(); track item.id; let idx = $index) {
  <div class="item-card" [class.active]="activeId() === item.id">
    <h4>{{ item.title }}</h4>
  </div>
  }
</div>
} @else {
<p>Không tìm thấy dữ liệu.</p>
}
```
