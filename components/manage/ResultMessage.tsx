import { techtronicaResultMessage } from "@/lib/techtronica/messages";

const successResults = new Set(["saved", "saved_draft", "member_added", "registered", "cancelled"]);
const errorResults = new Set(["error", "invalid", "club_access"]);

export default function ResultMessage({ result }: { result?: string }) {
  if (!result) return null;

  const message =
    techtronicaResultMessage[result as keyof typeof techtronicaResultMessage];
  if (!message) return null;

  const tone = successResults.has(result)
    ? "success"
    : errorResults.has(result)
      ? "error"
      : "warning";

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`techtronica-message techtronica-message-${tone} mt-5`}
    >
      {message}
    </p>
  );
}
