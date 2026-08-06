import { AuthForm } from '@/components/AuthForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-5 py-12">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold tracking-tight">
          Caspian Smart Port
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Порт Актау</p>
      </div>
      <AuthForm mode="login" />
    </main>
  );
}
