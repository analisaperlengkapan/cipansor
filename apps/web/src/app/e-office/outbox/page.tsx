import InboxPage from "../inbox/page";

export default function OutboxPage() {
  // Reuse inbox but we could force direction prop if we refactored InboxPage to accept props
  // For now, InboxPage handles switching internally, so we can just redirect or reuse
  return <InboxPage />;
}
