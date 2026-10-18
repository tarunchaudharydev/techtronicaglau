# Techtronica design tokens and shared copy

The frontend keeps shared visual values and common user-facing messages in two places:

- `app/globals.css`: palette, typography, spacing, radii, shadows, motion, and reusable UI classes.
- `lib/techtronica/messages.ts`: shared success, error, information, authentication, and management-result copy.

Use these shared tokens for new screens and update these files when changing the site-wide design language or standard wording.

## Color and style tokens

Change the light-mode values in `:root` and the matching dark-mode values under `.dark` in `app/globals.css`.

| Token family | Examples | Use |
| --- | --- | --- |
| Colors | `--techtronica-color-primary`, `--techtronica-color-error`, `--techtronica-color-surface` | Brand, state, and surface colors |
| Typography | `--techtronica-font-sans`, `--techtronica-text-sm` | Shared font family and type scale |
| Spacing | `--techtronica-space-card` | Standard component spacing |
| Shape | `--techtronica-radius-control`, `--techtronica-radius-card` | Form and card corners |
| Elevation | `--techtronica-shadow-card`, `--techtronica-shadow-popover` | Shared shadows |
| Motion | `--techtronica-transition-fast`, `--techtronica-transition-standard` | Shared transition timing |

Existing Tailwind classes such as `bg-background`, `text-foreground`, `bg-brand-sky`, and `border-border` remain mapped for compatibility. Prefer the semantic Techtronica tokens in new shared components.

Reusable classes include:

- `.techtronica-card` and `.techtronica-panel`
- `.techtronica-button-primary` and `.techtronica-button-secondary`
- `.input` and `.contact-input`
- `.techtronica-message` with `.techtronica-message-success`, `.techtronica-message-error`, `.techtronica-message-warning`, or `.techtronica-message-info`

Example:

```tsx
<button className="techtronica-button-primary">Save changes</button>
<p role="alert" className="techtronica-message techtronica-message-error">
  {techtronicaErrorMessage.generic}
</p>
```

## Shared messages

Import the appropriate copy group from `@/lib/techtronica/messages`:

```tsx
import {
  techtronicaErrorMessage,
  techtronicaSuccessMessage,
} from "@/lib/techtronica/messages";

setError(techtronicaErrorMessage.contactSubmit);
setNotice(techtronicaSuccessMessage.changesSaved);
```

Use the names as intent labels rather than repeating the same text in multiple components. For parameterized copy, use the helper, for example:

```ts
techtronicaErrorMessage.passwordLength(12, 72)
```

Management actions that return short result codes should use `techtronicaResultMessage` and the `ResultMessage` component. Add a result code and its user-facing text to the central map rather than adding another local message map.

## Copy and error handling rules

- Keep copy short, specific, and understandable to members.
- Do not show raw Supabase, database, HTTP, or stack-trace errors to users. Log technical details server-side and map expected failures to a safe shared message.
- Keep success, error, and informational states distinct so assistive technology can announce them correctly.
- For authentication, use generic responses where needed to avoid disclosing whether an email belongs to an account.
- When adding a new token, provide a corresponding dark-mode value when the token is color-related.
