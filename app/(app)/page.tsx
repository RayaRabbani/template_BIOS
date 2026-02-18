'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { signOut, useSession } from 'next-auth/react';

import { useAbilities } from '@/hooks/use-abilities';
import { cn } from '@/lib/utils';

export default function Page() {
  const { data: session, status } = useSession();
  const { ability, isLoading: abilitiesLoading } = useAbilities();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') {
      router.replace('/user/barang-inventaris/peminjaman');
      return;
    }

    if (status === 'unauthenticated' && !session) {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      router.replace('/user/barang-inventaris/peminjaman');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200"></div>
            <div className="absolute top-0 left-0 h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-[#01793b]"></div>
          </div>
          <p className="text-sm font-medium text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return null;

  /* 
  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-50 to-gray-100">
      <div className="mx-4 w-full max-w-2xl">
        <div className="rounded-lg bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              Welcome to Demplon
            </h1>
            <p className="text-gray-600">You are successfully logged in</p>
          </div>

          <div className="mb-6 border-t border-b border-gray-200 py-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">
              User Information
            </h2>

            <div className="space-y-4">
              {session.user?.id && (
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="w-32 font-medium text-gray-700">ID:</span>
                  <span className="text-gray-900">{session.user.id}</span>
                </div>
              )}

              {session.user?.name && (
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="w-32 font-medium text-gray-700">Name:</span>
                  <span className="text-gray-900">{session.user.name}</span>
                </div>
              )}

              {session.user?.email && (
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="w-32 font-medium text-gray-700">Email:</span>
                  <span className="text-gray-900">{session.user.email}</span>
                </div>
              )}

              {session.user?.roles && session.user.roles.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-start">
                  <span className="w-32 font-medium text-gray-700">Roles:</span>
                  <div className="flex flex-wrap gap-2">
                    {session.user.roles.map(role => (
                      <span
                        key={role}
                        className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {session.user?.image && (
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="w-32 font-medium text-gray-700">Image:</span>
                  <img
                    src={session.user.image}
                    alt="User avatar"
                    className="mt-2 h-16 w-16 rounded-full border-2 border-gray-300 sm:mt-0"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mb-6 rounded-lg bg-blue-50 p-4">
            <h3 className="mb-2 text-sm font-semibent text-gray-700">
              Abilities Check (CASL)
            </h3>
            {abilitiesLoading ? (
              <p className="text-sm text-gray-600">Loading abilities...</p>
            ) : ability ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-3 w-3 rounded-full ${ability.can('view', 'budgets') ? 'bg-green-500' : 'bg-red-500'}`}
                  ></span>
                  <span className="text-sm">Can view budgets</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-3 w-3 rounded-full ${ability.can('create', 'budgets') ? 'bg-green-500' : 'bg-red-500'}`}
                  ></span>
                  <span className="text-sm">Can create budgets</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-3 w-3 rounded-full ${ability.can('edit', 'budgets') ? 'bg-green-500' : 'bg-red-500'}`}
                  ></span>
                  <span className="text-sm">Can edit budgets</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-3 w-3 rounded-full ${ability.can('delete', 'budgets') ? 'bg-green-500' : 'bg-red-500'}`}
                  ></span>
                  <span className="text-sm">Can delete budgets</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-3 w-3 rounded-full ${ability.can('drop', 'budgets') ? 'bg-green-500' : 'bg-red-500'}`}
                  ></span>
                  <span className="text-sm">Can drop budgets</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No abilities loaded</p>
            )}
          </div>

          <div className="mb-6 rounded-lg bg-gray-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              Session Details
            </h3>
            <pre className="overflow-x-auto rounded bg-gray-800 p-4 text-xs text-green-400">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/auth/after-logout' })}
            className="w-full rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
  */
}
