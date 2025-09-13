interface _ISafeUser {
  id: string;
  email: string;
  roles: string[];
}

interface _ISessionCookie {
  token: string;
  type: SessionCookieType;
}

interface _ICookies {
  session: { token: string; type: SessionCookieType } | null;
  visitorId: string | null;
}

type SessionCookieType = 'firebase' | 'custom';
