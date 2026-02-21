import type { AppSummary } from "../entities/app.js";
import type { AppsRepository } from "../repositories/apps-repository.js";

export class FetchAppsUseCase {
  public constructor(private readonly appsRepository: AppsRepository) {}

  public async execute(): Promise<readonly AppSummary[]> {
    return this.appsRepository.listApps();
  }
}
