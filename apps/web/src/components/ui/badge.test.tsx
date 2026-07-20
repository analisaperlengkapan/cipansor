import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

/**
 * Smoke test that proves the jsdom + React Testing Library harness renders
 * real components. Also pins the Badge's variant/asChild contract.
 */
describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>Aktif</Badge>);
    expect(screen.getByText("Aktif")).toBeInTheDocument();
  });

  it("applies the destructive variant class", () => {
    render(<Badge variant="destructive">Nonaktif</Badge>);
    expect(screen.getByText("Nonaktif").className).toContain("bg-destructive");
  });

  it("renders as a child element when asChild is set", () => {
    render(
      <Badge asChild>
        <a href="/x">Tautan</a>
      </Badge>,
    );
    const link = screen.getByRole("link", { name: "Tautan" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("data-slot", "badge");
  });
});
