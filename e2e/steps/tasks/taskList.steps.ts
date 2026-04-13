import { test, expect } from '../../fixtures';
import { BaseStep } from '../base.step';
import { TaskListBdd } from './taskList.bdd';
import { TaskListPage } from '../../pages/tasks/taskList.page';
import { DashboardPage } from '../../pages/dashboard/dashboard.page';

export class TaskListSteps extends BaseStep {
  constructor(private readonly taskListPage: TaskListPage) {
    super();
  }

  /** AP-T163: User clicks a task row and navigates to task detail */
  async runApT163(): Promise<void> {
    const dashboardPage = new DashboardPage(this.taskListPage.page);

    await test.step(TaskListBdd.TASK_ROW_NAVIGATION.OPEN_DASHBOARD, async () => {
      await dashboardPage.navigateTo();
    });

    const firstTaskName = await dashboardPage.taskLinks.first().textContent();

    await test.step(TaskListBdd.TASK_ROW_NAVIGATION.CLICK_TASK_LINK, async () => {
      await dashboardPage.clickTaskLink(0);
    });

    await test.step(TaskListBdd.TASK_ROW_NAVIGATION.VERIFY_URL, async () => {
      await dashboardPage.page.waitForURL(/\/tasks\/\d+/);
      expect(dashboardPage.page.url()).toMatch(/\/tasks\/\d+/);
    });

    await test.step(TaskListBdd.TASK_ROW_NAVIGATION.SEE_TASK_DETAIL, async () => {
      const detailTitle = dashboardPage.page.locator('[data-cy="task-detail-title"]');
      await expect(detailTitle).toBeVisible();
      const taskNameInput = dashboardPage.page.locator('[data-cy="input-task-name"]');
      await expect(taskNameInput).toHaveValue(firstTaskName?.trim() ?? '');
    });
  }
}
