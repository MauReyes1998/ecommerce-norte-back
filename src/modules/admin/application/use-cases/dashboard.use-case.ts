import { Inject, Injectable } from '@nestjs/common';
import { DASHBOARD_REPOSITORY, DashboardRepository } from '../../domain/admin.repository';

export const LOW_STOCK_THRESHOLD = 3;

@Injectable()
export class DashboardUseCase {
  constructor(@Inject(DASHBOARD_REPOSITORY) private readonly dashboard: DashboardRepository) {}

  execute(rangeDays: 7 | 30 | 90 = 30) {
    return this.dashboard.stats(LOW_STOCK_THRESHOLD, rangeDays);
  }
}
