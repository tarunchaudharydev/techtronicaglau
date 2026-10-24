"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formString, parsedDate, requireManager, validId } from "@/lib/manage/server";
import { internshipArrangements, internshipCategories, internshipDegrees, isSafeHttpsUrl } from "@/lib/internships/core.mjs";

const supportedYears = [1, 2, 3, 4, 5, 6, 7, 8];

function slugify(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}

function selectedValues(formData: FormData, name: string, allowed: readonly string[], maxItems: number) {
  return [...new Set(formData.getAll(name).filter((entry): entry is string => typeof entry === "string" && allowed.includes(entry)))].slice(0, maxItems);
}

function cleanTags(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim().replace(/\s+/g, " ")).filter(Boolean))].slice(0, 40);
}

function parseOptionalIstDate(formData: FormData, field: string) {
  const raw = formString(formData, field, 40);
  if (raw === null || raw === "") return { value: null, valid: true };
  const value = parsedDate(raw);
  return { value, valid: value !== null };
}

async function saveListing(formData: FormData, existingId?: string) {
  const path = "/manage/internships";
  const { supabase } = await requireManager("internships.manage");
  const name = formString(formData, "company_name", 140);
  const careersUrl = formString(formData, "company_careers_url", 2048);
  const title = formString(formData, "title", 180);
  const description = formString(formData, "description", 12000);
  const applicationUrl = formString(formData, "application_url", 2048);
  const sourceUrl = formString(formData, "official_source_url", 2048);
  const arrangement = formString(formData, "work_arrangement", 20);
  const countryRaw = formString(formData, "country_code", 2);
  const city = formString(formData, "city", 100);
  const locationLabel = formString(formData, "location_label", 160);
  const skillsInput = formString(formData, "skills", 2000);
  const skills = cleanTags(skillsInput ?? "");
  const categories = selectedValues(formData, "technical_categories", internshipCategories, 10);
  const degrees = selectedValues(formData, "degree_requirements", internshipDegrees, 5);
  const years = selectedValues(formData, "eligible_years", supportedYears.map(String), 8).map(Number);
  const deadline = parseOptionalIstDate(formData, "deadline");
  const postedAt = parseOptionalIstDate(formData, "posted_at");
  const slug = name ? slugify(name) : "";

  if (!name || !slug || !title || !description || !applicationUrl || !sourceUrl || !careersUrl
      || !isSafeHttpsUrl(applicationUrl) || !isSafeHttpsUrl(sourceUrl) || !isSafeHttpsUrl(careersUrl)
      || skillsInput === null || !internshipArrangements.includes(arrangement ?? "") || !deadline.valid || !postedAt.valid
      || (countryRaw && !/^[A-Za-z]{2}$/.test(countryRaw))) {
    redirect(`${path}?result=invalid`);
  }

  const companyPayload = { name, slug, careers_url: careersUrl, is_active: true };
  const company = await supabase.from("internship_companies").upsert(companyPayload, { onConflict: "slug" }).select("id").single();
  if (company.error || !company.data) {
    console.error("Internship company save failed", { code: company.error?.code });
    redirect(`${path}?result=error`);
  }

  const listingPayload = {
    company_id: company.data.id,
    company_name: name,
    title,
    description,
    technical_categories: categories,
    skills,
    country_code: countryRaw ? countryRaw.toUpperCase() : null,
    city: city || null,
    location_label: locationLabel || null,
    work_arrangement: arrangement ?? "unknown",
    degree_requirements: degrees,
    eligible_years: years,
    application_url: applicationUrl,
    official_source_url: sourceUrl,
    source_name: "manual",
    posted_at: postedAt.value,
    deadline: deadline.value,
    listing_status: "unverified",
    verification_status: "pending",
    verified_at: null,
    verification_due_at: null,
    published_at: null,
  };

  const result = existingId
    ? await supabase.from("internships").update(listingPayload).eq("id", existingId).select("id").maybeSingle()
    : await supabase.from("internships").insert(listingPayload).select("id").single();
  if (result.error || !result.data) {
    console.error("Internship listing save failed", { code: result.error?.code });
    redirect(`${path}?result=error`);
  }

  revalidatePath("/internships");
  revalidatePath(path);
  redirect(`${path}?result=${existingId ? "updated_unverified" : "created_unverified"}`);
}

export async function createInternship(formData: FormData) {
  await saveListing(formData);
}

export async function updateInternship(formData: FormData) {
  const id = formString(formData, "id", 36);
  if (!validId(id)) redirect("/manage/internships?result=invalid");
  await saveListing(formData, id);
}

export async function verifyAndPublishInternship(formData: FormData) {
  const path = "/manage/internships";
  const { supabase } = await requireManager("internships.manage");
  const id = formString(formData, "id", 36);
  if (!validId(id) || formData.get("confirm_official_source") !== "yes") redirect(`${path}?result=verification_required`);
  const { data: listing, error: loadError } = await supabase.from("internships")
    .select("application_url, official_source_url, deadline")
    .eq("id", id).maybeSingle();
  if (loadError || !listing || !isSafeHttpsUrl(listing.application_url) || !isSafeHttpsUrl(listing.official_source_url)) {
    redirect(`${path}?result=error`);
  }
  if (listing.deadline && Date.parse(listing.deadline) <= Date.now()) redirect(`${path}?result=expired`);
  const now = new Date();
  const { error } = await supabase.from("internships").update({
    listing_status: "open",
    verification_status: "verified",
    verified_at: now.toISOString(),
    verification_due_at: new Date(now.valueOf() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    published_at: now.toISOString(),
  }).eq("id", id);
  if (error) {
    console.error("Internship verification failed", { code: error.code });
    redirect(`${path}?result=error`);
  }
  revalidatePath("/internships");
  revalidatePath(path);
  redirect(`${path}?result=published`);
}

export async function closeInternship(formData: FormData) {
  const path = "/manage/internships";
  const { supabase } = await requireManager("internships.manage");
  const id = formString(formData, "id", 36);
  if (!validId(id)) redirect(`${path}?result=invalid`);
  const { error } = await supabase.from("internships").update({ listing_status: "closed" }).eq("id", id);
  if (error) {
    console.error("Internship close failed", { code: error.code });
    redirect(`${path}?result=error`);
  }
  revalidatePath("/internships");
  revalidatePath(path);
  redirect(`${path}?result=closed`);
}
