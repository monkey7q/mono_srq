# JSON Diagram MVP Flow

## Goal
Run a minimal, reliable chain from natural language input to a normalized diagram JSON payload and a stable generation prompt.

## Stages
1. Input collection
   - Collect natural language prompt
   - Fix diagram type to `layered_architecture` for MVP
   - Select a preset from a short allowlist
2. Input validation
   - Reject empty or very short prompts
   - Reject unsupported diagram types or presets
3. JSON draft generation
   - Convert the prompt into a draft diagram JSON
   - Always call DeepSeek when a key is configured
   - Return a model-stage error when the key is missing or the response is malformed
4. Schema validation and normalization
   - Enforce required top-level fields
   - Normalize text and fill defaults
   - Reject invalid relations and unsupported enum values
5. Final generation prompt
   - Combine normalized JSON and preset metadata
   - Produce a stable prompt string for the image/model layer

## Failure Paths
- Invalid prompt input returns an `input` stage error
- Invalid generated JSON returns a `diagram` stage error
- Missing preset or unsupported enum values fail during validation

## Current Scope
- One diagram type: `layered_architecture`
- Two presets: `enterprise_blueprint`, `minimal_wireframe`
- Supports DeepSeek only
- No version management yet
