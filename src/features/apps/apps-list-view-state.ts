import type { AppSummary } from "../../domain/entities/app.js";

export type AppsListStatus = "idle" | "loading" | "loaded" | "error";

export interface AppsListViewState {
  readonly status: AppsListStatus;
  readonly apps: readonly AppSummary[];
  readonly errorMessage: string | null;
}

export const initialAppsListViewState: AppsListViewState = {
  status: "idle",
  apps: [],
  errorMessage: null
};
