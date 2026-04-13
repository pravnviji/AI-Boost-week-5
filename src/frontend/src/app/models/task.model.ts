export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: number;
  name: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdDate: string;
  dueDate: string;
}
