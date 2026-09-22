import { describe, expect, it } from "vitest";
import { BASE_PATH, withBasePath } from "@/lib/base-path";

describe("application base path", () => {
  it("keeps internal API and public-asset URLs under the deployed subpath", () => {
    expect(BASE_PATH).toBe("/foa_phd_network");
    expect(withBasePath("/api/people")).toBe("/foa_phd_network/api/people");
    expect(withBasePath("/maplibre/maplibre-gl-worker.mjs"))
      .toBe("/foa_phd_network/maplibre/maplibre-gl-worker.mjs");
  });
});
