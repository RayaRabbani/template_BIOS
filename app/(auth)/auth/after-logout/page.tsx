'use client';

import { signIn } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AfterLogoutPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <p className="text-muted-foreground mb-4 text-sm">
        You have been logged out.
      </p>
      <Button
        className="w-48"
        size="lg"
        onClick={() => signIn('kujang-id', { callbackUrl: '/' })}
      >
        Login Again
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Anda telah keluar</CardTitle>
          <CardDescription>
            Sesi Anda telah berakhir. Klik tombol di bawah untuk masuk kembali.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            className="w-full"
            size="lg"
            onClick={() => signIn('kujang-id', { callbackUrl: '/' })}
          >
            Login lagi
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
