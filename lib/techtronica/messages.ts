/**
 * Central user-facing copy for the Techtronica website.
 * Keep technical details and raw provider/database errors out of these messages.
 */
export const techtronicaErrorMessage = {
  generic: "Something went wrong. Please try again.",
  contactSubmit: "We could not send your message. Please try again.",
  saveFailed: "We could not save this change. Refresh the page and try again. If it continues, ask an administrator to check the Supabase function and access logs.",
  invalidForm: "Some fields are missing or invalid. Review the form and try again.",
  signInInvalid: "We could not sign you in with those details. Check them and try again.",
  signInUnavailable: "Sign-in is temporarily unavailable. Please try again.",
  authUnavailable: "Account access is temporarily unavailable. Please try again later.",
  resetLinkInvalid: "This reset link is no longer valid. Request a new one and try again.",
  resetLinkUnverified: "We could not verify the reset link. Request a new one and try again.",
  sessionUnverified: "We could not verify your session. Refresh and sign in again.",
  passwordUpdateFailed: "We could not update your password. Request a new reset link and try again.",
  passwordMismatch: "The passwords do not match.",
  passwordLength: (minimum: number, maximum: number) =>
    `Use a password between ${minimum} and ${maximum} characters.`,
} as const;

export const techtronicaSuccessMessage = {
  changesSaved: "Changes saved.",
  contactSent: "Message sent successfully!",
  memberAdded: "The account is now an active society member. No management role was added.",
  registrationConfirmed: "Registration confirmed.",
  registrationCancelled: "Registration cancelled.",
} as const;

export const techtronicaInfoMessage = {
  inviteSent: "Invitation sent. The person can use the link in their email to finish setting up the account.",
  memberAlreadyActive: "This account is already an active society member.",
  memberAccountMissing: "No account uses that email yet. The person must sign up and verify their email first.",
  memberEmailUnverified: "This account has not confirmed its email address yet. Add the member after email verification.",
  roleAlreadyExists: "A role with this name already exists. Choose a different name.",
  adminRoleRequired: "Your account needs the Society Admin role with admin.manage permission to create roles.",
  roleScopeMismatch: "The selected role and scope do not match. Choose a club for a club-scoped role, or choose society-wide for a society role.",
  recordConflict: "That name or assignment already exists, or the record is in use.",
  privateContentAccess: "You need an active society membership to view this private content.",
  registrationWaitlisted: "You are on the waitlist.",
  registrationAlreadyExists: "Your account already has a registration for this event.",
  registrationClosed: "Registration has closed or has not opened yet. Check the published event's India time (IST) and try again during its registration window.",
  teamSizeInvalid: "Your team details are incomplete or the number of members is outside this event's allowed range. Review the team form and try again.",
} as const;

export const techtronicaAuthMessage = {
  signInInput: "Enter a valid email address and password.",
  signUpName: "Enter your full name (2–120 characters).",
  emailInvalid: "Enter a valid email address.",
  registrationPrivate: "If this address can be registered, you will receive an email with the next step.",
  verificationSent: "Check your inbox for a verification link. You can sign in after confirming your email.",
  resetSent: "If an account uses that address, you will receive a password reset link.",
} as const;

export const techtronicaResultMessage = {
  saved: techtronicaSuccessMessage.changesSaved,
  invited: techtronicaInfoMessage.inviteSent,
  member_added: techtronicaSuccessMessage.memberAdded,
  member_exists: techtronicaInfoMessage.memberAlreadyActive,
  member_not_found: techtronicaInfoMessage.memberAccountMissing,
  member_not_verified: techtronicaInfoMessage.memberEmailUnverified,
  error: techtronicaErrorMessage.saveFailed,
  invalid: techtronicaErrorMessage.invalidForm,
  role_exists: techtronicaInfoMessage.roleAlreadyExists,
  admin_required: techtronicaInfoMessage.adminRoleRequired,
  scope_mismatch: techtronicaInfoMessage.roleScopeMismatch,
  conflict: techtronicaInfoMessage.recordConflict,
  permission: techtronicaInfoMessage.privateContentAccess,
  registered: techtronicaSuccessMessage.registrationConfirmed,
  waitlisted: techtronicaInfoMessage.registrationWaitlisted,
  cancelled: techtronicaSuccessMessage.registrationCancelled,
  duplicate: techtronicaInfoMessage.registrationAlreadyExists,
  closed: techtronicaInfoMessage.registrationClosed,
  team_size: techtronicaInfoMessage.teamSizeInvalid,
} as const;
