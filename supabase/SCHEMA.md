# Database Schema Documentation

## Entity Relationship Overview

```
auth.users
    ├── profiles (1:1)
    ├── vendors (1:many, owner)
    ├── leads (1:many, customer)
    └── bookings (1:many, customer)

vendors
    ├── drivers (1:many)
    ├── rate_plans (1:many)
    └── pos (1:many)

leads
    ├── request_docs (1:1)
    └── quotes (1:many)

quotes
    ├── quote_items (1:many)
    └── bookings (1:1 when accepted)

bookings
    ├── pos (1:many)
    ├── vouchers (1:many)
    ├── trips (1:1 when confirmed)
    └── cancellations (1:many)

trips
    ├── trip_members (1:many)
    ├── trip_posts (1:many)
    ├── driver_assignments (1:many)
    └── incidents (1:many)
```

## Status State Machines

### Lead
NEW → SCOPING → QUOTED → (WON | LOST)

### Quote
DRAFT → SENT → (ACCEPTED | DECLINED) → ARCHIVED

### Booking
PENDING_VENDOR_CONFIRM → CONFIRMED → IN_TRIP → (COMPLETED | CANCELLED)

### PO
SENT → ACCEPTED → CONFIRMED | DECLINED

### Trip Post
SCHEDULED → POSTED | CANCELLED

### Incident
OPEN → ACK → RESOLVED | CANCELLED

### Cancellation
REQUESTED → (APPROVED | REJECTED) → FINALIZED

## Key Constraints

- Quotes are versioned per lead (unique constraint on lead_id + version)
- Sent quotes are immutable (snapshot frozen)
- Bookings can only be created from ACCEPTED quotes
- Drivers' phone numbers never exposed (privacy)
- Trip members see only display names, not PII

