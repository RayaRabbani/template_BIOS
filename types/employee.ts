// Minimal types for demplon employee API response (used by lib/api/user.ts)
export type EmployeeLeader = {
  id?: string | number;
  nip?: string;
  no_badge?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  pic?: string;
};

export type EmployeeCompany = {
  id?: string;
  name?: string;
  description?: string;
  created_at?: string;
  updated_at?: string | null;
};

export type EmployeeRole = {
  id?: string;
  name?: string;
  group?: string;
  cluster?: number;
  rank?: number;
  structural?: boolean;
};

export type EmployeePosition = {
  id?: string;
  name?: string;
  group?: string;
};

export type EmployeeOrganization = {
  id?: string;
  code?: string;
  name?: string;
  description?: string;
  type?: string;
  alias?: string;
  aliases?: string[];
  leader?: EmployeeLeader;
};

export type EmployeeStructure = {
  id?: string;
  code?: string;
  treecode?: string;
  name?: string;
  description?: string;
  type?: string;
  alias?: string;
  aliases?: string[];
};

export type EmployeeApi = {
  id?: string | number;
  type?: string;
  group?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  company?: EmployeeCompany;
  organization?: EmployeeOrganization;
  structure?: EmployeeStructure;
  role?: EmployeeRole;
  position?: EmployeePosition;
  pic?: string;
  login?: string;
  [key: string]: unknown;
};