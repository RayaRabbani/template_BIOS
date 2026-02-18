import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
} from '@casl/ability';

import type { Abilities, Permission } from '@/types/permissions';

type Actions = Permission;
type Subjects = string | 'all';

export type AppAbility = MongoAbility<[Actions, Subjects]>;

export function buildAbilityFor(abilities: Abilities): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  abilities.forEach(role => {
    role.subjects.forEach(subject => {
      subject.permissions.forEach(permission => {
        can(permission, subject.id);
      });
    });
  });

  return build();
}

export { createMongoAbility };
