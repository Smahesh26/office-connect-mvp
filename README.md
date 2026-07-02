# Cambliss SaaS Platform

This repository currently contains the core Phase 1 platform surface plus supporting implementation notes. This single document replaces the previous scattered markdown files and summarizes the system in one place.

## Platform Scope

The product is organized around the following core areas:

- CRM for sales and lead management
- HRM for employee lifecycle and organization structure
- Inventory management for stock and operational control
- Secure file transfers with retention controls
- Basic video conferencing for internal collaboration

Historical marketplace and ecommerce artifacts have been removed from the codebase.

## Repository Layout

- `cambliss-backend/` - Express and Prisma backend services, seed scripts, and domain modules
- `cambliss-frontend/` - Next.js application with shared workspace pages and UI components

## Database Architecture

The backend uses a multi-tenant PostgreSQL-backed Prisma schema with a broad set of models for organizations, users, access control, CRM, HRM, inventory, invoicing, and supporting operational workflows. Relationships are structured to support organization-level isolation, module access, and audit-friendly data handling.

## GSTR-1 Tax Module

The GSTR-1 documentation previously covered:

- GST return generation and export flows
- B2B and B2C invoice classification
- JSON and CSV output formats
- Tax calculations for CGST, SGST, and IGST
- API setup and route registration
- Implementation notes, checklist, and quick reference material

### GSTR-1 Key Notes

- The module was documented with quick-start instructions, usage examples, implementation notes, and a completion summary.
- The documentation set also included validation and testing guidance for the reporting pipeline.

## HRM Module

The HRM documentation previously covered the employee engine, lifecycle operations, and organization hierarchy behavior.

### HRM Highlights

- Employee CRUD and lifecycle operations
- Organization and reporting hierarchy management
- Validation to prevent circular manager assignments
- Endpoint-level API reference and testing guidance
- Completion and phase status summaries

### Hierarchy System

The hierarchy docs focused on manager assignment validation and tree traversal behavior.

- Self-assignment prevention
- Direct and indirect loop detection
- Unlimited depth organization trees
- Hierarchy rendering and validation scenarios

## CRM Module

The CRM documentation previously highlighted:

- Lead creation and scoring workflows
- Sales dashboard and tracking views
- Auto-contact creation behavior
- Soft delete and audit trail patterns
- Enterprise feature notes for CRM-related workflows

## E-Way Bill Support

The backend documentation included E-Way Bill support material covering:

- Logistics compliance generation
- Eligibility and validation rules
- API endpoints for generation and history workflows
- GST number validation and related checks

## Testing and Validation

Previous docs captured several validation themes:

- HRM lifecycle and hierarchy test cases
- GSTR-1 implementation checklists and examples
- Integration-oriented notes for backend modules
- Phase completion summaries and readiness tracking

## Historical Documentation Notes

The following documentation sets were consolidated into this file:

- Database architecture and schema notes
- GSTR-1 quick reference, implementation notes, checklist, summary, integration guide, usage examples, and README material
- HRM API reference, testing guide, phase completion notes, hierarchy implementation, hierarchy completion, manager hierarchy testing, and hierarchy README material
- CRM feature notes and lead creation documentation
- E-Way Bill README material
- Frontend README material

## Current State

The workspace has been cleaned to keep the platform-focused source code and a single markdown overview. Any previous marketplace or ecommerce-specific markdown documentation has been removed.
