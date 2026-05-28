import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { collectionTypes } from '../../models/collection-types.enum';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FirestoreService } from '../../firestore/firestore.service';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { MatError } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dialog-create-post',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatError,
  ],
  templateUrl: './dialog-create-post.component.html',
  styleUrl: './dialog-create-post.component.scss',
})
export class DialogCreatePostComponent {
  data: any = '';
  myForm: FormGroup;
  userId: string = '';

  constructor(
    private firestoreService: FirestoreService,
    private fb: FormBuilder,
    private authService: AuthService,
    private dialogRef: MatDialogRef<DialogCreatePostComponent>
  ) {
    this.data = inject(MAT_DIALOG_DATA);

    this.myForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(40)]],
      body: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(300)]],
    });
  }

  ngOnInit() {
    this.authService.getCurrentUser().subscribe((user) => {
      if (user) {
        this.userId = user.uid;
      }
    });
  }

  async createPost() {
    if (this.myForm.invalid) {
      console.log('Error: Form is invalid');
      return;
    }

    const { title, body } = this.myForm.value;
    try {
      await this.firestoreService.createNewPost(
        title,
        body,
        this.data.method,
        this.userId
      );
      this.dialogRef.close(true);
    } catch (err) {
      console.error('Error creating post:', err);
    }
  }
}

