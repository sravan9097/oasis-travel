# @oasis/utils

Shared utility functions for the Oasis Travel platform.

## Installation

```bash
npm install @oasis/utils
```

## Usage

```typescript
import {
  formatDate,
  formatINR,
  truncate,
  isValidEmail,
  parseFlags,
} from '@oasis/utils';

// Date formatting
const date = formatDate(new Date(), 'MMM dd, yyyy');

// Money formatting
const price = formatINR(5000); // ₹5,000

// String utilities
const short = truncate('Long text here', 10);

// Validation
const isValid = isValidEmail('test@example.com');

// Feature flags
const flags = parseFlags(adminSettings.value);
```

## Modules

- **date.ts**: Date formatting, relative time, calculations
- **money.ts**: INR formatting, GST calculations, compact numbers
- **strings.ts**: Truncate, slugify, sanitize, initials
- **validation.ts**: Phone, email, GSTIN, UUID, URL validation
- **feature-flags.ts**: Feature flag parsing and checking

## Tests

Run tests with:

```bash
npm test
```

