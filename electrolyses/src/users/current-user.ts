const CURRENT_USER_ID = 1;

export interface CurrentUser {
  readonly id: number;
}

let currentUser: CurrentUser | null = null;

export function getCurrentUser(): CurrentUser {
  if (currentUser === null) {
    currentUser = Object.freeze({ id: CURRENT_USER_ID });
  }

  return currentUser;
}
