import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { LocalStore } from '../local-store/local-store';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  constructor(private readonly store: LocalStore) {}

  async createNewPost(
    title: string,
    body: string,
    collectionType: string,
    userId: string
  ) {
    return this.store.addPost(collectionType, {
      title,
      body,
      userId,
      likes: [],
    });
  }

  async getAllPosts(collectionType: string): Promise<any[]> {
    return this.store.getPosts(collectionType).map((post) => ({ ...post }));
  }

  getAllPostsByUser(collectionType: string, userId: string): Observable<any[]> {
    return this.store
      .postsStream(collectionType)
      .pipe(map((posts) => posts.filter((p) => p.userId === userId).map((p) => ({ ...p }))));
  }

  async getPostLikesforDetails(postId: string, collectionType: string): Promise<string[]> {
    const post = this.store.getPost(collectionType, postId);
    if (!post) {
      throw new Error('Post not found');
    }
    return post.likes ?? [];
  }

  async likePost(postId: string, uid: string, collectionType: string) {
    const post = this.store.getPost(collectionType, postId);
    if (!post) throw new Error(`Post ${postId} not found`);
    const likes = post.likes ?? [];
    if (!likes.includes(uid)) {
      this.store.updatePost(collectionType, postId, { likes: [...likes, uid] });
    }
  }

  async dislikePost(postId: string, uid: string, collectionType: string) {
    const post = this.store.getPost(collectionType, postId);
    if (!post) throw new Error(`Post ${postId} not found`);
    const likes = (post.likes ?? []).filter((id) => id !== uid);
    this.store.updatePost(collectionType, postId, { likes });
  }

  async getPostLikes(postId: string, collectionType: string): Promise<string[]> {
    const post = this.store.getPost(collectionType, postId);
    if (!post) {
      console.error(`Post with ID ${postId} not found.`);
      return [];
    }
    return post.likes ?? [];
  }

  async updatePost(
    collectionType: string,
    postId: string,
    updatedData: any
  ): Promise<void> {
    const updated = this.store.updatePost(collectionType, postId, updatedData);
    if (!updated) throw new Error(`Post ${postId} not found`);
  }

  async deletePost(collectionType: string, postId: string): Promise<void> {
    const ok = this.store.removePost(collectionType, postId);
    if (!ok) throw new Error(`Post ${postId} not found`);
  }

  async getPostByUserId(collectionType: string, postId: string): Promise<any> {
    const post = this.store.getPost(collectionType, postId);
    if (!post) {
      console.error(`Post with ID ${postId} not found.`);
      return null;
    }
    return { ...post };
  }
}
