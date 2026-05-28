import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of, throwError } from 'rxjs';
import { LocalStore, PublicUser } from '../local-store/local-store';

export type User = PublicUser;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly userSubject: BehaviorSubject<User | null>;
  currentUser$: Observable<User | null>;

  constructor(private readonly store: LocalStore) {
    this.userSubject = new BehaviorSubject<User | null>(this.store.getCurrentUser());
    this.currentUser$ = this.userSubject.asObservable();
  }

  signUp(email: string, password: string): Observable<void> {
    try {
      const user = this.store.createUser(email, password);
      this.store.setCurrentUser(user);
      this.userSubject.next(user);
      return of(undefined);
    } catch (err) {
      return throwError(() => err);
    }
  }

  signIn(email: string, password: string): Observable<void> {
    try {
      const user = this.store.authenticate(email, password);
      this.store.setCurrentUser(user);
      this.userSubject.next(user);
      return of(undefined);
    } catch (err) {
      return throwError(() => err);
    }
  }

  isLoggedIn(): Observable<boolean> {
    return this.currentUser$.pipe(map((user) => !!user));
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser$;
  }

  async logout(): Promise<void> {
    this.store.setCurrentUser(null);
    this.userSubject.next(null);
  }
}
