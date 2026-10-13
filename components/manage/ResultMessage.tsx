export default function ResultMessage({ result }: { result?: string }) {
  if (!result) return null;
  const messages: Record<string, string> = {
    saved: "Changes saved.",
    invited: "Invitation sent. The person can use the link in their email to finish setting up the account.",
    member_added: "The account is now an active society member. No management role was added.",
    member_exists: "This account is already an active society member.",
    member_not_found: "No account uses that email yet. The person must sign up and verify their email first.",
    member_not_verified: "This account has not confirmed its email address yet. Add the member after email verification.",
    error: "We could not save this change. Refresh the page and try again. If it continues, ask an administrator to check the Supabase function and access logs.",
    invalid: "Some fields are missing or invalid. Review the form and try again.",
    role_exists: "A role with this name already exists. Choose a different name.",
    admin_required: "Your account needs the Society Admin role with admin.manage permission to create roles.",
    scope_mismatch: "The selected role and scope do not match. Choose a club for a club-scoped role, or choose society-wide for a society role.",
    conflict: "That name or assignment already exists, or the record is in use.",
    permission: "You need an active society membership to view this private content.",
    registered: "Registration confirmed.",
    waitlisted: "You are on the waitlist.",
    cancelled: "Registration cancelled.",
    duplicate: "Your account already has a registration for this event.",
  };
  const message = messages[result];
  if (!message) return null;
  return <p role="status" className={`mt-5 rounded-xl p-4 text-sm ${result === "saved" ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-950"}`}>{message}</p>;
}
