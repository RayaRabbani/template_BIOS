import { useEffect, useMemo } from 'react';

import { useSession } from 'next-auth/react';

import { buildAbilityFor, type AppAbility } from '@/lib/casl';
import { useAbilitiesStore } from '@/stores/abilities-store';

export function useAbilities(): {
  ability: AppAbility | null;
  isLoading: boolean;
} {
  const { status } = useSession();
  const { abilities, isLoaded, setAbilities, reset } = useAbilitiesStore();

  useEffect(() => {
    if (status === 'authenticated' && !isLoaded) {
      fetch('/api/abilities')
        .then(res => res.json())
        .then(data => setAbilities(data))
        .catch(err => {
          console.error('Failed to load abilities:', err);
          setAbilities([]);
        });
    }

    if (status === 'unauthenticated') {
      reset();
    }
  }, [status, isLoaded, setAbilities, reset]);

  const ability = useMemo(() => {
    if (!isLoaded) {
      return null;
    }

    return buildAbilityFor(abilities);
  }, [abilities, isLoaded]);

  return {
    ability,
    isLoading: status === 'loading' || !isLoaded,
  };
}
