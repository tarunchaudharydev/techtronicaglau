import ResourceDirectory from "./ResourceDirectory";
import { getPublicSiteContent } from "@/lib/data/public-content";

export default async function AcademicsPage() {
  const resources = await getPublicSiteContent("learning_resource");
  return <ResourceDirectory resources={resources ?? []} />;
}
