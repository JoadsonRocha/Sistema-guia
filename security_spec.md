# Security Specification: Sistema Águia

## Data Invariants
1. A Transaction must have a positive amount.
2. An Urgency status can only be 'pendente', 'aprovado', or 'negado'.
3. Only coordinators can approve or deny fuel/urgency requests.
4. Fuel requests cannot exceed the remaining team balance (though this is hard to enforce purely in rules without atomic counters or complex logic, we will check invariants).
5. A Voter must have a valid leaderId matching the creator's UID.
6. A Voter name satisfies string size constraints to prevent resource poisoning.

## The Dirty Dozen Payloads (Targeting Rejection)

1. **Identity Spoofing**: Attempting to create a team document with a fake ID.
2. **Privilege Escalation**: A user attempting to write to the `stats/global` document without being an admin.
3. **Ghost Field Injection**: Adding an `isVerified: true` field to a Team document.
4. **Invalid Enum**: Setting an Urgency status to 'HACKED'.
5. **Negative Amount**: Creating a transaction with `amount: -1000`.
6. **Self-Promotion**: A user trying to create an entry in the `/admins/` collection.
7. **Resource Poisoning**: Document ID with 2KB of junk characters.
8. **Immutability Breach**: Attempting to change `createdAt` on an existing Urgency.
9. **Zero-Trust Bypass**: Reading all PII in a user's private subcollection (if we had one).
10. **Query Scrape**: Listing all transactions without being signed in.
11. **Sync Vulnerability**: Attempting to increment `totalAllocated` in `stats/global` without creating a corresponding `Transaction` (requires `existsAfter`).
12. **Status Shortcutting**: Directly moving an Urgency from 'pendente' to 'aprovado' by someone who is not an admin.
13. **Voter Hijacking**: Attempting to create a Voter record with someone else's UID as `leaderId`.

## Test Runner (Simplified Concept)
We will verify that these payloads return PERMISSION_DENIED.
