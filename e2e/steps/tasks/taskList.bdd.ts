export const TaskListBdd = {
  TASK_ROW_NAVIGATION: {
    OPEN_DASHBOARD: 'User opens the Dashboard page',
    CLICK_TASK_LINK: 'User clicks a task name link in the recent tasks table',
    VERIFY_URL: 'Browser navigates to /tasks/:id',
    SEE_TASK_DETAIL: 'Task detail page is displayed with the correct task name',
  },
} as const;
