export const BASE_URL = process.env.UI_BASE_URL ?? 'http://localhost:4200';

export const ROUTES = {
  dashboard: `${BASE_URL}/dashboard`,
  tasks: `${BASE_URL}/tasks`,
  taskNew: `${BASE_URL}/tasks/new`,
  taskDetail: (id: number) => `${BASE_URL}/tasks/${id}`,
} as const;
