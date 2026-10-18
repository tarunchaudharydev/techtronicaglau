import {
  techtronicaErrorMessage,
  techtronicaInfoMessage,
  techtronicaResultMessage,
  techtronicaSuccessMessage,
} from "@/lib/techtronica/messages";

const successResults = new Set(["saved", "member_added", "registered", "cancelled"]);
const errorResults = new Set(["error", "invalid"]);

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

  // Keep these references visible here as the shared result map is the
  // canonical copy source for these categories.
  void techtronicaErrorMessage;
  void techtronicaInfoMessage;
  void techtronicaSuccessMessage;

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`techtronica-message techtronica-message-${tone} mt-5`}
    >
      {message}
    </p>
  );
}
