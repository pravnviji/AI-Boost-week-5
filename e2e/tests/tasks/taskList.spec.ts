import { test } from '../../fixtures';
import { appTest } from '../../lib/test-wrapper';
import { TaskListSteps } from '../../steps/tasks/taskList.steps';
import { TaskListPage } from '../../pages/tasks/taskList.page';

test.describe('Task List', () => {
  test.describe.configure({ mode: 'serial' });

  // ──── Task Row Navigation ──────────────────────────────────────────

  appTest({
    zephyrTestCaseKey: 'AP-T163',
    name: 'Task Row Navigation - User clicks a task row and navigates to task detail',
    fn: async ({ authenticatedPage }) => {
      const page = new TaskListPage(authenticatedPage);
      await new TaskListSteps(page).runApT163();
    },
  });
});
