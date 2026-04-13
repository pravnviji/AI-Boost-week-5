import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { TaskService } from '../../services/task.service';
import { Task, TaskStatus, TaskPriority } from '../../models/task.model';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss',
})
export class TaskDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);

  readonly isNew = signal(true);
  readonly pageTitle = signal('New Task');

  name = '';
  description = '';
  status: TaskStatus = 'Pending';
  priority: TaskPriority = 'Medium';
  dueDate = '';

  readonly statuses: TaskStatus[] = ['Pending', 'In Progress', 'Completed'];
  readonly priorities: TaskPriority[] = ['Low', 'Medium', 'High'];

  private taskId: number | null = null;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      this.taskId = Number(idParam);
      const task = this.taskService.getById(this.taskId);
      if (task) {
        this.isNew.set(false);
        this.pageTitle.set('Edit Task');
        this.name = task.name;
        this.description = task.description;
        this.status = task.status;
        this.priority = task.priority;
        this.dueDate = task.dueDate;
      }
    }
  }

  save(): void {
    const payload: Partial<Task> = {
      name: this.name,
      description: this.description,
      status: this.status,
      priority: this.priority,
      dueDate: this.dueDate,
    };
    if (this.taskId) payload.id = this.taskId;

    this.taskService.save(payload);
    this.router.navigate(['/tasks']);
  }

  cancel(): void {
    this.router.navigate(['/tasks']);
  }
}
