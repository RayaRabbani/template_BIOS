export type Permission = string;

export interface Subject {
  id: string;
  permissions: Permission[];
}

export interface Role {
  id: string;
  subjects: Subject[];
}

export type Abilities = Role[];
