import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FirestoreService } from '../../firestore/firestore.service';
import { AuthService } from '../../auth/auth.service';
import { collectionTypes } from '../../models/collection-types.enum';
import { Observable, combineLatest, map, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
})
export class UserProfileComponent {
  userId: string = '';
  posts$: Observable<any[]> = of([]);
  editState: { [key: string]: boolean } = {};
  editForms: { [key: string]: FormGroup } = {};

  constructor(
    private firestoreService: FirestoreService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.authService.getCurrentUser().subscribe((user) => {
      if (user) {
        this.userId = user.uid;
        const streams = Object.values(collectionTypes).map((collection) =>
          this.firestoreService
            .getAllPostsByUser(collection, this.userId)
            .pipe(map((posts) => posts.map((p) => ({ ...p, collection }))))
        );
        this.posts$ = combineLatest(streams).pipe(
          map((arrays) => arrays.flat())
        );
      }
    });
  }

  toggleEditState(postId: string, currentTitle: string, currentBody: string) {
    if (this.editState[postId]) {
      if (this.editForms[postId]) {
        this.editForms[postId].setValue({
          title: currentTitle,
          body: currentBody,
        });
      }
    } else {
      if (!this.editForms[postId]) {
        this.editForms[postId] = this.fb.group({
          title: [currentTitle, [Validators.required, Validators.minLength(5)]],
          body: [currentBody, [Validators.required, Validators.minLength(10)]],
        });
      }
    }

    this.editState[postId] = !this.editState[postId];
  }

  updatePost(post: any) {
    const form = this.editForms[post.id];
    if (form && form.valid) {
      const updatedData = {
        title: form.value.title,
        body: form.value.body,
      };
      this.firestoreService
        .updatePost(post.collection, post.id, updatedData)
        .then(() => {
          this.editState[post.id] = false;
          alert('Post updated successfully!');
        })
        .catch((error) => {
          console.error('Error updating post:', error);
          alert('Failed to update the post.');
        });
    } else {
      alert('Please fix errors before saving.');
    }
  }

  deletePost(post: any) {
    if (confirm('Are you sure you want to delete this post?')) {
      this.firestoreService
        .deletePost(post.collection, post.id)
        .then(() => {
          alert('Post deleted successfully!');
        })
        .catch((error) => {
          console.error('Error deleting post:', error);
          alert('Failed to delete the post.');
        });
    }
  }
}
