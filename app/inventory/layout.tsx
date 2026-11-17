import { UserButton } from "@clerk/nextjs";
import { ItemIcon } from "../ui/ItemIcon";

export default function InventoryLayout({ children }: LayoutProps<"/inventory">) {
  return (
    <>
      <header className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 pt-4">
        <p className="m-0 flex items-center gap-2 font-display text-lg">
          <ItemIcon kind="notebook" className="size-8" decorative />
          Stationery Inventory
        </p>
        <UserButton />
      </header>
      <main className="mx-auto max-w-4xl px-4 pt-3 pb-12">{children}</main>
    </>
  );
}
