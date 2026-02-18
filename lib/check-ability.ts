import type { Permission } from '@/types/permissions';

import { getAbilitiesFromBackend } from './abilities';
import { auth } from './auth';
import { buildAbilityFor } from './casl';

export async function canUserPerform(
  action: Permission,
  subject: string
): Promise<boolean> {
  const session = await auth();

  if (!session) {
    return false;
  }

  const abilities = await getAbilitiesFromBackend();
  const ability = buildAbilityFor(abilities);

  return ability.can(action, subject);
}
