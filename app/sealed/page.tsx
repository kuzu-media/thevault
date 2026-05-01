// Sealed — ceremonial closing-of-the-vault page.
//
// When you arrive with ?just=sealed or ?just=unsealed, the dial plays the
// transition animation. Without the param it just shows the current state.

import { getAllItems, getSettings } from "@/lib/data";
import { setSealed } from "@/lib/actions";
import { SealedScreen } from "@/components/sealed-screen";

export default async function SealedPage({
  searchParams,
}: {
  searchParams: Promise<{ just?: string }>;
}) {
  const { just } = await searchParams;
  const [settings, items] = await Promise.all([getSettings(), getAllItems()]);
  const sealed = !!settings?.sealed;

  async function unseal() {
    "use server";
    await setSealed(false);
  }
  async function seal() {
    "use server";
    await setSealed(true);
  }

  return (
    <SealedScreen
      sealed={sealed}
      itemCount={items.length}
      animate={just === "sealed" || just === "unsealed"}
      unsealAction={unseal}
      sealAction={seal}
    />
  );
}
