import { expect, type Locator, type Page } from '@playwright/test';

export class TaskListPage {
  readonly page: Page;
  readonly container: Locator;
  readonly title: Locator;
  readonly filters: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly priorityFilter: Locator;
  readonly clearFiltersButton: Locator;
  readonly createTaskButton: Locator;
  readonly tasksTable: Locator;
  readonly taskRows: Locator;
  readonly taskLinks: Locator;
  readonly statusChips: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('[data-cy="task-list-page"]');
    this.title = page.locator('[data-cy="task-list-title"]');
    this.filters = page.locator('[data-cy="task-list-filters"]');
    this.searchInput = page.locator('[data-cy="filter-search"]');
    this.statusFilter = page.locator('[data-cy="filter-status"]');
    this.priorityFilter = page.locator('[data-cy="filter-priority"]');
    this.clearFiltersButton = page.locator('[data-cy="btn-clear-filters"]');
    this.createTaskButton = page.locator('[data-cy="btn-create-task"]');
    this.tasksTable = page.locator('[data-cy="task-list-table"]');
    this.taskRows = page.locator('[data-cy="task-row"]');
    this.taskLinks = page.locator('[data-cy="task-link"]');
    this.statusChips = page.locator('[data-cy="task-status-chip"]');
  }

  async navigateTo(): Promise<void> {
    await this.page.goto('/tasks');
    await expect(this.title).toBeVisible();
  }

  async selectStatusFilter(status: string): Promise<void> {
    await this.statusFilter.click();
    await this.page.getByRole('option', { name: status }).click();
  }

  async clickClearFilters(): Promise<void> {
    await this.clearFiltersButton.click();
  }
}
