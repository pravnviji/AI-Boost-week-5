import { expect, type Locator, type Page } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly dashboardContainer: Locator;
  readonly title: Locator;
  readonly summaryCards: Locator;
  readonly totalTasksCard: Locator;
  readonly totalTasksValue: Locator;
  readonly completedCard: Locator;
  readonly completedValue: Locator;
  readonly inProgressCard: Locator;
  readonly inProgressValue: Locator;
  readonly pendingCard: Locator;
  readonly pendingValue: Locator;
  readonly recentTasksHeading: Locator;
  readonly tasksTable: Locator;
  readonly taskRows: Locator;
  readonly taskLinks: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dashboardContainer = page.locator('[data-cy="dashboard-page"]');
    this.title = page.locator('[data-cy="dashboard-title"]');
    this.summaryCards = page.locator('[data-cy="dashboard-summary-cards"]');
    this.totalTasksCard = page.locator('[data-cy="card-total"]');
    this.totalTasksValue = page.locator('[data-cy="card-total-value"]');
    this.completedCard = page.locator('[data-cy="card-completed"]');
    this.completedValue = page.locator('[data-cy="card-completed-value"]');
    this.inProgressCard = page.locator('[data-cy="card-in-progress"]');
    this.inProgressValue = page.locator('[data-cy="card-in-progress-value"]');
    this.pendingCard = page.locator('[data-cy="card-pending"]');
    this.pendingValue = page.locator('[data-cy="card-pending-value"]');
    this.recentTasksHeading = page.locator('[data-cy="recent-tasks-heading"]');
    this.tasksTable = page.locator('[data-cy="dashboard-tasks-table"]');
    this.taskRows = page.locator('[data-cy="task-row"]');
    this.taskLinks = page.locator('[data-cy="task-link"]');
  }

  async navigateTo(): Promise<void> {
    await this.page.goto('/dashboard');
    await expect(this.title).toBeVisible();
  }

  async verifySummaryCardsVisible(): Promise<void> {
    await expect(this.totalTasksCard).toBeVisible();
    await expect(this.completedCard).toBeVisible();
    await expect(this.inProgressCard).toBeVisible();
    await expect(this.pendingCard).toBeVisible();
  }

  async clickTaskLink(index: number): Promise<void> {
    await this.taskLinks.nth(index).click();
  }
}
