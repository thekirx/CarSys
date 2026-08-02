import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const requiredEnvironment = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DEMO_USER_PASSWORD",
  "DEMO_IDENTITY_MARKER_SECRET",
];

const markerSecret = "carsys-test-marker-secret-with-32-plus-bytes";
const demoUser = {
  identityKey: "apex-owner",
  email: "owner@apex-autohaus.example",
  displayName: "Mara Santos",
  roleCode: "owner",
};

let bootstrapModule;
let consoleErrorSpy;
let originalExitCode;

beforeAll(async () => {
  const originalEnvironment = Object.fromEntries(
    requiredEnvironment.map((name) => [name, process.env[name]]),
  );
  originalExitCode = process.exitCode;
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  for (const name of requiredEnvironment) {
    delete process.env[name];
  }

  try {
    vi.resetModules();
    bootstrapModule = await import("../../../scripts/create-demo-users.mjs");
    await Promise.resolve();
  } finally {
    for (const [name, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  }
});

afterAll(() => {
  process.exitCode = originalExitCode;
  consoleErrorSpy.mockRestore();
});

function authUserWithMarker(marker, metadata = {}) {
  return {
    app_metadata: { carsys_demo_identity: marker },
    user_metadata: metadata,
  };
}

describe("demo identity bootstrap module", () => {
  it("can be imported without executing the bootstrap entry point", () => {
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(originalExitCode);
    expect(bootstrapModule.createDemoIdentityMarker).toBeTypeOf("function");
  });

  it("accepts a valid app_metadata identity marker", () => {
    const marker = bootstrapModule.createDemoIdentityMarker(demoUser, markerSecret);

    expect(
      bootstrapModule.isExpectedDemoIdentity(
        authUserWithMarker(marker),
        demoUser,
        markerSecret,
      ),
    ).toBe(true);
  });

  it("rejects an unmarked user", () => {
    expect(
      bootstrapModule.isExpectedDemoIdentity(
        { app_metadata: {}, user_metadata: {} },
        demoUser,
        markerSecret,
      ),
    ).toBe(false);
  });

  it("does not trust a marker stored only in user_metadata", () => {
    const marker = bootstrapModule.createDemoIdentityMarker(demoUser, markerSecret);

    expect(
      bootstrapModule.isExpectedDemoIdentity(
        {
          app_metadata: {},
          user_metadata: { carsys_demo_identity: marker },
        },
        demoUser,
        markerSecret,
      ),
    ).toBe(false);
  });

  it("rejects a forged signature", () => {
    const marker = bootstrapModule.createDemoIdentityMarker(demoUser, markerSecret);
    const forgedSignature = `${marker.signature.slice(0, -1)}${
      marker.signature.endsWith("A") ? "B" : "A"
    }`;

    expect(
      bootstrapModule.isExpectedDemoIdentity(
        authUserWithMarker({ ...marker, signature: forgedSignature }),
        demoUser,
        markerSecret,
      ),
    ).toBe(false);
  });

  it.each([
    ["identityKey", "another-owner"],
    ["email", "someone-else@apex-autohaus.example"],
    ["roleCode", "viewer"],
  ])("rejects a valid marker with the wrong %s", (field, value) => {
    const mismatchedMarker = bootstrapModule.createDemoIdentityMarker(
      { ...demoUser, [field]: value },
      markerSecret,
    );

    expect(
      bootstrapModule.isExpectedDemoIdentity(
        authUserWithMarker(mismatchedMarker),
        demoUser,
        markerSecret,
      ),
    ).toBe(false);
  });

  it("rejects a marker secret shorter than 32 bytes", () => {
    expect(() =>
      bootstrapModule.createDemoIdentityMarker(demoUser, "too-short"),
    ).toThrow("at least 32 bytes");
  });

  it("preserves existing user_metadata while overriding display_name", () => {
    expect(
      bootstrapModule.mergeDemoUserMetadata(
        {
          display_name: "Old Name",
          locale: "fil-PH",
          onboarding_complete: true,
        },
        demoUser.displayName,
      ),
    ).toEqual({
      display_name: "Mara Santos",
      locale: "fil-PH",
      onboarding_complete: true,
    });
  });
});
