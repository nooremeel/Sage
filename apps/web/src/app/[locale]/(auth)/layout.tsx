import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Illustration } from '@/components/illustrations/illustration';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col justify-center items-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center flex flex-col items-center">
          <Illustration name="logo-leaf" size={48} wash="amber" />
        </div>
        <Card className="p-8 shadow-e1 border-border bg-card">
          {children}
        </Card>
      </div>
    </div>
  );
}
