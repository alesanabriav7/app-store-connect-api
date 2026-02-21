import type { AppSummary } from "../entities/app.js";

export interface AppsRepository {
  listApps(): Promise<readonly AppSummary[]>;
}
