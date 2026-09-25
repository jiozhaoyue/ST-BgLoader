# Frontend Development Guidelines

> Best practices for frontend development in this project.

---

## Overview

This directory contains guidelines for frontend development. Fill in each file with your project's specific conventions.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Module organization and file layout | Filled |
| [Component Guidelines](./component-guidelines.md) | Subsystem classes, layer double-buffering, destroy contract | Filled |
| [Hook Guidelines](./hook-guidelines.md) | N/A (no framework): settings fan-out + event bus | Filled |
| [State Management](./state-management.md) | settings object, cloud mirror, media library pointers | Filled |
| [Quality Guidelines](./quality-guidelines.md) | E2E bar, UI code standards | Filled |
| [Host-Native UI](./host-native-ui.md) | Stay indistinguishable from the host: use its seams (drawer/theme vars/menu_button), no glow, inline-style policy | Filled |
| [Type Safety](./type-safety.md) | strict config, central type module, cast boundaries | Filled |

---

## How to Fill These Guidelines

For each guideline file:

1. Document your project's **actual conventions** (not ideals)
2. Include **code examples** from your codebase
3. List **forbidden patterns** and why
4. Add **common mistakes** your team has made

The goal is to help AI assistants and new team members understand how YOUR project works.

---

**Language**: All documentation should be written in **English**.
