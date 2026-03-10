"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/* ── Generic fetch helper ──────────────────────────────────────────────────── */

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? "Request failed");
  }
  return res.json();
}

/* ── Query keys ────────────────────────────────────────────────────────────── */

export const queryKeys = {
  projects: ["projects"] as const,
  project: (id: string) => ["projects", id] as const,
  templates: (filters?: Record<string, string>) =>
    ["templates", filters ?? {}] as const,
  profile: (username: string) => ["profile", username] as const,
  analytics: (days?: number) => ["analytics", days ?? 30] as const,
  projectAnalytics: (id: string) => ["analytics", "project", id] as const,
  explore: (filters?: Record<string, string>) =>
    ["explore", filters ?? {}] as const,
};

/* ── Project hooks ─────────────────────────────────────────────────────────── */

export function useProjects(params?: Record<string, string>) {
  const search = params ? `?${new URLSearchParams(params)}` : "";
  return useQuery({
    queryKey: [...queryKeys.projects, params],
    queryFn: () => apiFetch(`/api/projects${search}`),
    staleTime: 2 * 60 * 1000, // 2 min
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => apiFetch(`/api/projects/${id}`),
    staleTime: 30 * 1000,
    enabled: !!id,
  });
}

/* ── Template hooks ────────────────────────────────────────────────────────── */

export function useTemplates(filters?: Record<string, string>) {
  const search = filters ? `?${new URLSearchParams(filters)}` : "";
  return useQuery({
    queryKey: queryKeys.templates(filters),
    queryFn: () => apiFetch(`/api/templates${search}`),
    staleTime: 5 * 60 * 1000, // 5 min (templates are mostly static)
  });
}

/* ── Explore hooks ─────────────────────────────────────────────────────────── */

export function useExplore(filters?: Record<string, string>) {
  const search = filters ? `?${new URLSearchParams(filters)}` : "";
  return useQuery({
    queryKey: queryKeys.explore(filters),
    queryFn: () => apiFetch(`/api/explore${search}`),
    staleTime: 60 * 1000,
  });
}

/* ── Mutations with cache invalidation ─────────────────────────────────────── */

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useLikeProject(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch(`/api/watch/${projectId}/like`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.project(projectId),
      });
    },
  });
}
