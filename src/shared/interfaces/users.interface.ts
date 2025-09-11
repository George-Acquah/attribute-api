export interface _ILoginUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
  // Add other fields as necessary
}
