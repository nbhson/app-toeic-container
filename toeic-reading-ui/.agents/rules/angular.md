# Angular Style Rules & Coding Standards

This document outlines the strict style rules and coding standards for Angular development in this repository.

## 1. Standalone Components

- Every component must be `standalone: true`.
- Do not import `CommonModule` directly. Instead, import specific dependencies if needed, or rely entirely on modern Angular control flow.
- Explicitly define `changeDetection: ChangeDetectionStrategy.OnPush` in the `@Component` decorator.

## 2. Signal Usage

- Use `signal<T>` for writable state (e.g., toggle flags, selected options, search terms).
- Use `computed<T>` for all read-only, derived values (e.g., filtering lists, progress percentage).
- Use `input<T>` and `input.required<T>` instead of the legacy `@Input()` decorator.
- Use `output<T>` instead of the legacy `@Output()` decorator.

## 3. Data Fetching

- Use the `resource()` API for asynchronous loaders and API requests.
- Bind loading (`resource.isLoading()`) and error (`resource.error()`) states in the HTML templates.
- Do not trigger side effects inside constructor unless wrapped in `effect()` or `untracked()`.

## 4. File Suffixes

- Components: `*.component.ts` (Class name ends with `Component`)
- Services: `*.service.ts` (Class name ends with `Service`)
- Guards: `*.guard.ts`
- Models: `*.model.ts`
- Constants: `*.constants.ts` or `mock-*.ts`
