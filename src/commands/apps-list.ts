import { InfrastructureError, type AppStoreConnectClient } from "../api/client.js";

// ---------------------------------------------------------------------------
// API response type (inline)
// ---------------------------------------------------------------------------

interface AppsListResponse {
  readonly data: readonly {
    readonly id: string;
    readonly attributes: {
      readonly name: string;
      readonly bundleId: string;
      readonly sku?: string;
    };
  }[];
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface AppSummary {
  readonly id: string;
  readonly name: string;
  readonly bundleId: string;
  readonly sku?: string;
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

const DEFAULT_LIST_LIMIT = 50;

export async function appsListCommand(
  client: AppStoreConnectClient,
  options: { readonly json: boolean }
): Promise<number> {
  const response = await client.request<AppsListResponse>({
    method: "GET",
    path: "/v1/apps",
    query: { limit: DEFAULT_LIST_LIMIT }
  });

  const apps = response.data.data.map((item) => {
    const attributes = item.attributes;

    if (!item.id || !attributes?.name || !attributes?.bundleId) {
      throw new InfrastructureError(
        "Malformed app payload received from App Store Connect."
      );
    }

    const summary: AppSummary = {
      id: item.id,
      name: attributes.name,
      bundleId: attributes.bundleId
    };

    if (attributes.sku !== undefined) {
      return { ...summary, sku: attributes.sku } satisfies AppSummary;
    }

    return summary;
  });

  const sorted = [...apps].sort((a, b) => a.name.localeCompare(b.name));

  if (options.json) {
    console.log(JSON.stringify(sorted, null, 2));
    return 0;
  }

  if (sorted.length === 0) {
    console.log("No apps were returned by App Store Connect.");
    return 0;
  }

  console.log("Apps:");
  for (const app of sorted) {
    console.log(`- ${app.name} (${app.bundleId}) [${app.id}]`);
  }

  return 0;
}

export async function listApps(client: AppStoreConnectClient): Promise<readonly AppSummary[]> {
  const response = await client.request<AppsListResponse>({
    method: "GET",
    path: "/v1/apps",
    query: { limit: DEFAULT_LIST_LIMIT }
  });

  return response.data.data.map((item) => {
    const attributes = item.attributes;

    if (!item.id || !attributes?.name || !attributes?.bundleId) {
      throw new InfrastructureError(
        "Malformed app payload received from App Store Connect."
      );
    }

    const summary: AppSummary = {
      id: item.id,
      name: attributes.name,
      bundleId: attributes.bundleId
    };

    if (attributes.sku !== undefined) {
      return { ...summary, sku: attributes.sku } satisfies AppSummary;
    }

    return summary;
  });
}
