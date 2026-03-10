// ─────────────────────────────────────────────────────────────────────────────
// Explore API Route — paginated movie feed for infinite scroll
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getExploreMovies, type SortMode } from "@/lib/explore-data";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const cursor = Math.max(0, parseInt(params.get("cursor") ?? "0", 10) || 0);
  const limit = Math.min(50, Math.max(1, parseInt(params.get("limit") ?? "12", 10) || 12));
  const genre = params.get("genre") ?? undefined;
  const sort = (params.get("sort") ?? "all") as SortMode;
  const search = params.get("search") ?? undefined;

  const data = await getExploreMovies(cursor, limit, genre, sort, search);
  return NextResponse.json(data);
}
