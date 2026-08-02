import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createSupabaseCookieAdapter,
  createSupabaseResponseMutations,
} from "@/lib/supabase/response-mutations";

const cookieStoreSetMock = vi.fn();

describe("server Supabase cookie adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("collects each SSR cookie and required response header while writing the Next cookie store", async () => {
    const responseMutations = createSupabaseResponseMutations();
    const cookieAdapter = createSupabaseCookieAdapter(
      {
        getAll: vi.fn().mockReturnValue([]),
        set: cookieStoreSetMock,
      },
      responseMutations,
    );

    await cookieAdapter.setAll?.(
      [
        {
          name: "sb-auth",
          value: "new-session",
          options: { httpOnly: true, path: "/", sameSite: "lax" },
        },
      ],
      {
        "Cache-Control":
          "private, no-cache, no-store, must-revalidate, max-age=0",
        Expires: "0",
        Pragma: "no-cache",
      },
    );

    expect(cookieStoreSetMock).toHaveBeenCalledWith(
      "sb-auth",
      "new-session",
      { httpOnly: true, path: "/", sameSite: "lax" },
    );
    expect(responseMutations.cookies).toEqual([
      {
        name: "sb-auth",
        value: "new-session",
        options: { httpOnly: true, path: "/", sameSite: "lax" },
      },
    ]);
    expect(Object.fromEntries(responseMutations.headers)).toEqual({
      "cache-control":
        "private, no-cache, no-store, must-revalidate, max-age=0",
      expires: "0",
      pragma: "no-cache",
    });
  });

  it("retains collected mutations when the current Next context cannot write cookies", async () => {
    cookieStoreSetMock.mockImplementation(() => {
      throw new Error("read-only cookie store");
    });
    const responseMutations = createSupabaseResponseMutations();
    const cookieAdapter = createSupabaseCookieAdapter(
      {
        getAll: vi.fn().mockReturnValue([]),
        set: cookieStoreSetMock,
      },
      responseMutations,
    );

    expect(() =>
      cookieAdapter.setAll?.(
        [
          {
            name: "sb-auth",
            value: "new-session",
            options: { httpOnly: true, path: "/", sameSite: "lax" },
          },
        ],
        { "Cache-Control": "private, no-store" },
      ),
    ).not.toThrow();
    expect(responseMutations.cookies).toHaveLength(1);
    expect(responseMutations.headers.get("cache-control")).toBe(
      "private, no-store",
    );
  });
});
