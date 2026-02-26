Always use Context7 MCP when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.

# ChurchShare — Project Context & Tech Stack Rules

> This file is automatically loaded by Qwen Code into every agent and main session.
> All agents MUST follow every rule in this file without exception.
> Run `/memory show` inside Qwen Code to confirm this file is active before starting work.

---

## Project Overview

**ChurchShare** is a zero-download PDF sharing platform for church congregations, built specifically for elderly users (ages 50–70+). Two core features drive everything:

1. **Zero-Download Viewer** — PDFs render in a mobile browser via PDF.js. Nothing is ever saved to the device.
2. **Hot-Swap Slots** — Each document slot has a permanent URL. The admin replaces the PDF; the link never changes.

---

## ⚙️ Mandatory Tech Stack

This is the **only** approved stack. Do not suggest, scaffold, or introduce any alternative.

| Layer | Technology | Version |
|---|---|---|
| Language | Java | 21 (LTS) |
| Backend Framework | Spring Boot | **4.0.3** |
| Spring Framework (transitive) | Spring Framework | 7.0.x |
| Build Tool | Maven | 3.9+ |
| Frontend Framework | Angular | **v21** (NOT AngularJS 1.x) |
| Frontend Language | TypeScript | 5.9+ |
| Frontend Build | Angular CLI | v21 |
| Change Detection | Zoneless (no Zone.js) | Angular 21 default |
| Forms | Signal Forms (`form()`) | Angular 21 |
| Testing (FE) | Vitest | Angular 21 default |
| HTTP Client (FE) | Angular `HttpClient` | provided by default in v21 |
| PDF Rendering | PDF.js | Latest stable (loaded via Angular service) |
| Database | PostgreSQL | 15+ |
| ORM | Spring Data JPA + Hibernate | 7.1.x (via Spring Boot 4.0.3) |
| Schema Migrations | Flyway | 11.x (via Spring Boot 4.0.3) |
| File Storage | Cloudflare R2 | via AWS SDK for Java v2 |
| Auth | Spring Security | 7.0.x (via Spring Boot 4.0.3) |
| JWT | jjwt | 0.12.x |
| Testing (BE) | JUnit 5 + Mockito + Spring Boot Test | via Spring Boot 4.0.3 |

---
