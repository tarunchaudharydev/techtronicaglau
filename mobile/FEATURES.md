# Mobile feature coverage

This tracks actual mobile coverage against the website. A planned or missing workflow is not represented as implemented.

| Website capability | Mobile status |
| --- | --- |
| Public society landing | Initial screen |
| Club directory | Read-only, live Supabase data |
| Upcoming published events | Read-only, live Supabase data |
| Verified internship directory | Read-only, official application links |
| Clerk sign-in and sign-up | Clerk hosted flow; native callback setup required |
| Account image and identity | Clerk avatar and identity |
| Current role display | Initial query present; needs profile identity verification |
| Club applications and membership review | Not implemented |
| Event registration and team management | Not implemented |
| Meeting attendance sheets | Not implemented |
| Notifications and birthday greetings | Not implemented |
| Profile editing and student year updates | Not implemented |
| Admin tools for events, clubs, memberships, roles, internships, and content | Not implemented |
| Team, alumni, research, gallery, learning resources, and contacts | Not implemented |
| Push notifications and offline support | Not implemented |

## Implementation rule

Use the website’s existing Supabase project and database policies. Do not create mobile-only role tables, bypass RLS, embed service credentials, or assume that hiding controls grants or denies access. For writes, reuse the website’s protected database functions and verify their behavior with the same Clerk identity.

## Profile-linking follow-up

The web app links Clerk identities to stable rows in profiles. This initial native shell does not call a shared profile-provisioning endpoint. Before enabling new native sign-ups in production, verify how the backend links native Clerk identities to profile rows and reuse the trusted provisioning flow. Do not insert privileged profile records from the client to work around it.
