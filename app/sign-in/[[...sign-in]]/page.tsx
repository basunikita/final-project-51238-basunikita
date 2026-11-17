import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Suspense fallback={<p className="window">Loading sign-in…</p>}>
        <SignIn />
      </Suspense>
    </main>
  );
}
