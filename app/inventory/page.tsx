import { auth } from "@clerk/nextjs/server";
import { navigation } from "next/cache";
import { resolveSelection } from "@/lib/inventory";
import { loadInventory } from "@/lib/inventory-server";
import InventoryScreen from "./InventoryScreen";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function InventoryPage({ searchParams }: PageProps<"/inventory">) {
  await auth.protect();
  // Load the stash only on the actual visit. A prefetch would abandon the
  // database request halfway and cache "Your stash didn't open" instead.
  await navigation();
  const inventory = await loadInventory();
  if (!inventory.ok) {
    return (
      <section className="window grid justify-items-start gap-3" role="alert">
        <h1 className="m-0 text-2xl">Your stash didn&apos;t open</h1>
        <p className="m-0">{inventory.message}</p>
        <a href="/inventory" className="btn btn-primary">
          Try again
        </a>
      </section>
    );
  }
  const params = await searchParams;
  const { placeId, itemId } = resolveSelection(inventory.places, inventory.items, {
    place: first(params.place),
    item: first(params.item),
  });
  return (
    <InventoryScreen
      places={inventory.places}
      items={inventory.items}
      initialPlaceId={placeId}
      initialItemId={itemId}
      now={new Date().toISOString()}
    />
  );
}
