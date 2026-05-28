import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LocalUser {
  uid: string;
  email: string;
  password: string;
}

export interface PublicUser {
  uid: string;
  email: string;
}

export interface StoredPost {
  id: string;
  title: string;
  body: string;
  userId: string;
  likes: string[];
}

const USERS_KEY = 'forum-app:users';
const CURRENT_USER_KEY = 'forum-app:current-user';
const POSTS_PREFIX = 'forum-app:posts:';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function randomId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

@Injectable({ providedIn: 'root' })
export class LocalStore {
  private readonly postStreams = new Map<string, BehaviorSubject<StoredPost[]>>();

  // ---------- Users ----------
  getUsers(): LocalUser[] {
    return readJson<LocalUser[]>(USERS_KEY, []);
  }

  saveUsers(users: LocalUser[]): void {
    writeJson(USERS_KEY, users);
  }

  createUser(email: string, password: string): PublicUser {
    const users = this.getUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw { code: 'auth/email-already-in-use', message: 'Email already in use' };
    }
    const user: LocalUser = { uid: randomId(), email, password };
    users.push(user);
    this.saveUsers(users);
    return { uid: user.uid, email: user.email };
  }

  authenticate(email: string, password: string): PublicUser {
    const users = this.getUsers();
    const match = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!match) {
      throw { code: 'auth/user-not-found', message: 'No user with that email' };
    }
    if (match.password !== password) {
      throw { code: 'auth/invalid-credential', message: 'Invalid credentials' };
    }
    return { uid: match.uid, email: match.email };
  }

  getCurrentUser(): PublicUser | null {
    return readJson<PublicUser | null>(CURRENT_USER_KEY, null);
  }

  setCurrentUser(user: PublicUser | null): void {
    if (user) {
      writeJson(CURRENT_USER_KEY, user);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }

  // ---------- Posts ----------
  private postsKey(collection: string): string {
    return `${POSTS_PREFIX}${collection}`;
  }

  private getStream(collection: string): BehaviorSubject<StoredPost[]> {
    let stream = this.postStreams.get(collection);
    if (!stream) {
      stream = new BehaviorSubject<StoredPost[]>(this.getPosts(collection));
      this.postStreams.set(collection, stream);
    }
    return stream;
  }

  getPosts(collection: string): StoredPost[] {
    return readJson<StoredPost[]>(this.postsKey(collection), []);
  }

  savePosts(collection: string, posts: StoredPost[]): void {
    writeJson(this.postsKey(collection), posts);
    this.getStream(collection).next(posts);
  }

  postsStream(collection: string): Observable<StoredPost[]> {
    return this.getStream(collection).asObservable();
  }

  addPost(collection: string, post: Omit<StoredPost, 'id'>): StoredPost {
    const posts = this.getPosts(collection);
    const created: StoredPost = { id: randomId(), ...post };
    posts.push(created);
    this.savePosts(collection, posts);
    return created;
  }

  updatePost(collection: string, id: string, patch: Partial<StoredPost>): StoredPost | null {
    const posts = this.getPosts(collection);
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    posts[idx] = { ...posts[idx], ...patch, id: posts[idx].id };
    this.savePosts(collection, posts);
    return posts[idx];
  }

  removePost(collection: string, id: string): boolean {
    const posts = this.getPosts(collection);
    const next = posts.filter((p) => p.id !== id);
    if (next.length === posts.length) return false;
    this.savePosts(collection, next);
    return true;
  }

  getPost(collection: string, id: string): StoredPost | null {
    return this.getPosts(collection).find((p) => p.id === id) ?? null;
  }
}
