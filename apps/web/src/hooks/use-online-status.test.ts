import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useIsOnline } from "./use-online-status";

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    get: () => value,
  });
}

describe("useIsOnline", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setNavigatorOnline(true);
  });

  afterEach(() => {
    setNavigatorOnline(true);
  });

  it("reports online when navigator.onLine is true", () => {
    const { result } = renderHook(() => useIsOnline());
    expect(result.current).toBe(true);
  });

  it("stays online when navigator.onLine lies but the probe succeeds", async () => {
    setNavigatorOnline(false);
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useIsOnline());

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    // The probe reached the server, so we must NOT show as offline.
    expect(result.current).toBe(true);
  });

  it("reports offline when navigator.onLine is false and the probe fails", async () => {
    setNavigatorOnline(false);
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useIsOnline());

    await waitFor(() => expect(result.current).toBe(false));
  });

  it("recovers immediately on the online event", async () => {
    setNavigatorOnline(false);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("network down")),
    );

    const { result } = renderHook(() => useIsOnline());
    await waitFor(() => expect(result.current).toBe(false));

    setNavigatorOnline(true);
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current).toBe(true);
  });
});
