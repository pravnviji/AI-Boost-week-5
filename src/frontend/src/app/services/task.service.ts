import { Injectable, signal, computed } from '@angular/core';
import { Task, TaskStatus, TaskPriority } from '../models/task.model';

const SEED_TASKS: Task[] = [
  { id: 1, name: 'Design landing page', description: 'Create wireframes for the new landing page', status: 'Completed', priority: 'High', createdDate: '2026-04-01', dueDate: '2026-04-10' },
  { id: 2, name: 'Implement auth module', description: 'Add login / logout with OAuth 2.0', status: 'In Progress', priority: 'High', createdDate: '2026-04-03', dueDate: '2026-04-15' },
  { id: 3, name: 'Write unit tests', description: 'Cover task service with Jest specs', status: 'Pending', priority: 'Medium', createdDate: '2026-04-05', dueDate: '2026-04-20' },
  { id: 4, name: 'Setup CI pipeline', description: 'Configure GitHub Actions for lint + test + deploy', status: 'Pending', priority: 'Low', createdDate: '2026-04-06', dueDate: '2026-04-25' },
  { id: 5, name: 'Update dependencies', description: 'Bump Angular to latest patch release', status: 'Completed', priority: 'Low', createdDate: '2026-04-02', dueDate: '2026-04-08' },
];

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly _tasks = signal<Task[]>(SEED_TASKS);

  readonly tasks = this._tasks.asReadonly();
  readonly totalTasks = computed(() => this._tasks().length);
  readonly completedTasks = computed(() => this._tasks().filter((t) => t.status === 'Completed').length);
  readonly pendingTasks = computed(() => this._tasks().filter((t) => t.status === 'Pending').length);
  readonly inProgressTasks = computed(() => this._tasks().filter((t) => t.status === 'In Progress').length);

  getById(id: number): Task | undefined {
    return this._tasks().find((t) => t.id === id);
  }

  filter(params: { status?: TaskStatus; priority?: TaskPriority; search?: string }): Task[] {
    let result = this._tasks();
    if (params.status) result = result.filter((t) => t.status === params.status);
    if (params.priority) result = result.filter((t) => t.priority === params.priority);
    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    return result;
  }

  save(task: Partial<Task>): Task {
    if (task.id) {
      this._tasks.update((list) => list.map((t) => (t.id === task.id ? { ...t, ...task } as Task : t)));
      return this.getById(task.id)!;
    }
    const newTask: Task = {
      id: Math.max(0, ...this._tasks().map((t) => t.id)) + 1,
      name: task.name ?? '',
      description: task.description ?? '',
      status: task.status ?? 'Pending',
      priority: task.priority ?? 'Medium',
      createdDate: new Date().toISOString().slice(0, 10),
      dueDate: task.dueDate ?? '',
    };
    this._tasks.update((list) => [...list, newTask]);
    return newTask;
  }

  delete(id: number): void {
    this._tasks.update((list) => list.filter((t) => t.id !== id));
  }
}
