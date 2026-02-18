'use client';

import { useEffect } from 'react';

import { Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function SignInPage() {
  useEffect(() => {
    signIn('kujang-id', { callbackUrl: '/' });
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Loader2 className="mb-4 size-8 animate-spin"></Loader2>
      <p className="text-muted-foreground text-sm">Logging you in...</p>
    </div>
  );
}
