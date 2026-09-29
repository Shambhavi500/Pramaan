import { supabase } from "@/lib/db";

export interface SiteContext {
  orgId: string;
  projectId: string | null;
  siteId: string | null;
}

/**
 * Resolves org / project / site from a public_id whose folder follows
 * "pramaan/<org-slug>/<site-code>/<file>", e.g. "pramaan/green-aravalli/GA-17/abc123".
 */
export async function resolveContextFromFolder(publicId: string): Promise<SiteContext | null> {
  const [, orgSlug, siteCode] = publicId.split("/");

  const orgQuery = supabase.from("org").select("id");
  const { data: org } = orgSlug
    ? await orgQuery.eq("slug", orgSlug).maybeSingle()
    : await orgQuery.limit(1).maybeSingle();
  if (!org) return null;

  let projectId: string | null = null;
  let siteId: string | null = null;
  if (siteCode) {
    const { data: site } = await supabase
      .from("site")
      .select("id, project_id")
      .eq("code", siteCode)
      .limit(1)
      .maybeSingle();
    if (site) {
      siteId = site.id;
      projectId = site.project_id;
    }
  }
  return { orgId: org.id, projectId, siteId };
}
