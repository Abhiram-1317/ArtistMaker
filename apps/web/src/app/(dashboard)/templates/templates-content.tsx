"use client";

import { TemplateGallery } from "@/components/templates";
import type { TemplateData } from "@/lib/templates-data";

interface TemplatesPageContentProps {
  templates: TemplateData[];
}

export function TemplatesPageContent({ templates }: TemplatesPageContentProps) {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
          Template <span className="gradient-text">Gallery</span>
        </h1>
        <p className="mt-1 text-gray-400 text-sm sm:text-base">
          Browse pre-built templates to jumpstart your next cinematic masterpiece.
        </p>
      </div>

      {/* Full gallery with all filters */}
      <TemplateGallery
        templates={templates}
        title=""
        showFilters
        showSearch
        columns={3}
      />
    </div>
  );
}
