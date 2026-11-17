import Link from "next/link";
import { SESSION_ENDED } from "@/lib/inventory";

// The alert region stays mounted, so screen readers announce a message as
// soon as it appears.
export function Problem({ id, message }: { id?: string; message: string }) {
  return (
    <div id={id} role="alert">
      {message && (
        <p className="error">
          {message === SESSION_ENDED ? (
            <>
              Your session ended.{" "}
              <Link href="/sign-in?redirect_url=/inventory" className="underline underline-offset-2">
                Sign in again.
              </Link>
            </>
          ) : (
            message
          )}
        </p>
      )}
    </div>
  );
}
