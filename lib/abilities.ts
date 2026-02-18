import type { Abilities } from '@/types/permissions';

import { auth } from './auth';

export async function getAbilitiesFromBackend(): Promise<Abilities> {
  const session = await auth();

  if (!session?.idToken && !session?.legacyIdToken) {
    return [];
  }

  // const token = session.idToken || session.legacyIdToken;

  // try {
  //   const response = await fetch(
  //     `${process.env.BACKEND_API_URL}/api/permissions`,
  //     {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         'Content-Type': 'application/json',
  //       },
  //     }
  //   );

  //   if (!response.ok) {
  //     console.error('Failed to fetch abilities:', response.statusText);
  //     return [];
  //   }

  //   const data: Abilities = await response.json();
  //   return data;
  // } catch (error) {
  //   console.error('Error fetching abilities:', error);
  //   return [];
  // }

  return [
    {
      id: 'admin',
      subjects: [
        {
          id: 'budgets',
          permissions: ['view', 'create', 'edit', 'delete'],
        },
      ],
    },
  ];
}
