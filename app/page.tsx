import { NetworkExplorer } from "@/components/network-explorer";
import { getPublicDataset } from "@/lib/server/dataset";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Home() {
  const dataset = await getPublicDataset();
  return <NetworkExplorer initialDataset={dataset} />;
}
