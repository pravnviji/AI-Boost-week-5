import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { TaskService } from '../../services/task.service';
import { TaskStatus, TaskPriority } from '../../models/task.model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatChipsModule,
  ],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
})
export class TaskListComponent {
  private readonly taskService = inject(TaskService);
  private readonly router = inject(Router);

  readonly statusFilter = signal<TaskStatus | ''>('');
  readonly priorityFilter = signal<TaskPriority | ''>('');
  readonly searchQuery = signal('');

  readonly filteredTasks = computed(() =>
    this.taskService.filter({
      status: this.statusFilter() || undefined,
      priority: this.priorityFilter() || undefined,
      search: this.searchQuery() || undefined,
    }),
  );

  readonly displayedColumns = ['name', 'status', 'priority', 'dueDate', 'actions'];
  readonly statuses: TaskStatus[] = ['Pending', 'In Progress', 'Completed'];
  readonly priorities: TaskPriority[] = ['Low', 'Medium', 'High'];

  clearFilters(): void {
    this.statusFilter.set('');
    this.priorityFilter.set('');
    this.searchQuery.set('');
  }

  openTask(id: number): void {
    this.router.navigate(['/tasks', id]);
  }

  createTask(): void {
    this.router.navigate(['/tasks/new']);
  }

  deleteTask(id: number): void {
    this.taskService.delete(id);
  }
}
