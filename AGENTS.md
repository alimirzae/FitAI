# Instructions for AI Coding Agents

All AI agents modifying the FitAI codebase must follow these directives:

1. **Read Core Blueprint**: Consult `README.md`, `docs/architecture/ARCHITECTURE.md`, `roadmap/ROADMAP.md`, and `memory/PROJECT_MEMORY.md` prior to structural changes.
2. **Update Project Memory**: Whenever you make architectural or feature updates, append the rationale and outcome to `memory/PROJECT_MEMORY.md` and `roadmap/ROADMAP.md`.
3. **Preserve Open-Source Licensing**: Ensure every new model or library maintains a commercial-compatible license (Apache-2.0 or MIT) and is audited in `docs/licenses/MODEL_LICENSE_MATRIX.md`. Never introduce proprietary cloud AI as a hard dependency.
4. **Bilingual Integrity**: Always maintain parity between English (LTR) and Persian / فارسی (RTL) across all components and translation keys.
5. **Fabric & Physics Preservation**: Preserve fabric material parameters in try-on models to ensure photorealistic cloth draping.
6. **Container & Port Constraints**: App runs on port 3000 (`0.0.0.0`) in AI Studio Cloud Run containers.
