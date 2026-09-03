export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: {
    id: string;
    name: string;
    slug: string;
  } | null;
  registration_type: 'local' | 'external';
  permissions: string[];
}
