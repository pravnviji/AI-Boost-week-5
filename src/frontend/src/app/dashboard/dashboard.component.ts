import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { TaskService } from '../services/task.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly taskService = inject(TaskService);
  private readonly router = inject(Router);

  readonly totalTasks = this.taskService.totalTasks;
  readonly completedTasks = this.taskService.completedTasks;
  readonly pendingTasks = this.taskService.pendingTasks;
  readonly inProgressTasks = this.taskService.inProgressTasks;
  readonly recentTasks = this.taskService.tasks;

  readonly displayedColumns = ['name', 'status', 'priority', 'dueDate'];

  openTask(id: number): void {
    this.router.navigate(['/tasks', id]);
  }
}
