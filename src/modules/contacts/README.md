# Contacts (module 4)

**FRS:** §6.4 Contacts  
**Stage:** 2 · Reference data (Layer 1)  
**Owner:** Dev C  

## Tables

- `contacts` — Lucid Contacts Data entity (guest / housekeeper / contractor)

## Routes

- `/contacts` — list, filter, create, edit (nav label: Guests)

## Commands

```bash
bun drizzle:migrate   # applies 0003_contacts
bun db:seed           # Layer 0 users/properties; add contacts via UI
```
