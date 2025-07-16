// custom.d.ts
declare namespace Express {
  interface Request {
    user: _ISafeUser;
    token: string;
  }
}
