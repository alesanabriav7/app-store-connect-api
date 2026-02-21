import { describe, expect, it } from "vitest";

import { createAppsListViewModel } from "../../src/features/apps/create-apps-list-feature.js";

describe("createAppsListViewModel", () => {
  it("wires repository, use case, and view model", async () => {
    const viewModel = createAppsListViewModel({
      listApps: async () => [
        {
          id: "1",
          name: "Demo",
          bundleId: "com.example.demo"
        }
      ]
    });

    await viewModel.refresh();

    expect(viewModel.snapshot.status).toBe("loaded");
    expect(viewModel.snapshot.apps[0]?.name).toBe("Demo");
  });
});
