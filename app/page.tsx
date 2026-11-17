import Link from "next/link";
import { KINDS } from "@/lib/inventory";
import { ItemIcon } from "./ui/ItemIcon";

export default function Home() {
  return (
    <main className="mx-auto grid min-h-screen max-w-3xl content-center gap-6 px-4 py-10">
      <section className="window grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p className="eyebrow">Stationery Inventory</p>
          <h1 className="mt-1.5 mb-3.5 text-[clamp(2.3rem,8vw,3.5rem)]">Stationery Inventory</h1>
          <p className="mb-5 max-w-[38ch] text-[1.2rem] font-bold">
            For stationery lovers who keep buying notebooks they already own: see everything you
            have, where it lives, and what&apos;s still waiting to be used.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/sign-up" className="btn btn-primary">
              Sign up
            </Link>
            <Link href="/sign-in" className="btn">
              Sign in
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-2" aria-hidden="true">
          {KINDS.map((kind) => (
            <div key={kind} className="slot">
              <ItemIcon kind={kind} decorative />
              {kind === "notebook" && <span className="badge-new">NEW</span>}
            </div>
          ))}
        </div>
      </section>
      <p className="text-center text-sm text-muted">
        <a href="/proposal" className="underline underline-offset-2">
          Read the project proposal
        </a>
      </p>
    </main>
  );
}
