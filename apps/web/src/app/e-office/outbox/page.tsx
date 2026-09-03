import InboxPage from "../inbox/page";
import { LetterDirection } from "@cipansor/shared";

export default function OutboxPage() {
  return <InboxPage defaultDirection={LetterDirection.OUTGOING} />;
}
