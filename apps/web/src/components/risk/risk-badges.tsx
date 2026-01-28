import { Badge } from "@/components/ui/badge";

export function RiskStatusBadge({ status }: { status: string }) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";

  switch (status) {
    case "OPEN":
      variant = "default"; // or blue
      break;
    case "MONITORING":
      variant = "secondary"; // or yellow
      break;
    case "CLOSED":
      variant = "outline"; // or gray
      break;
  }

  return <Badge variant={variant}>{status}</Badge>;
}

export function RiskLevelBadge({ level }: { level: string }) {
  let className = "";

  switch (level) {
    case "LOW":
      className = "bg-green-500 hover:bg-green-600";
      break;
    case "MEDIUM":
      className = "bg-yellow-500 hover:bg-yellow-600 text-black";
      break;
    case "HIGH":
      className = "bg-orange-500 hover:bg-orange-600";
      break;
    case "EXTREME":
      className = "bg-red-500 hover:bg-red-600";
      break;
  }

  return <Badge className={className}>{level}</Badge>;
}
