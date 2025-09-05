import type { Component } from 'vue';

export interface Tool {
  name: string
  path: string
  description: string
  keywords: string[]
  component: () => Promise<Component>
  icon: Component
  redirectFrom?: string[]
  isNew: boolean
  createdAt?: Date
  npmPackages?: string[]
  footer?: string
  category: string
}

export interface ToolCategory {
  name: string
  components: Tool[]
}

export interface ToolsFilter {
  excludeCategoryFilterRegex?: string
  includeCategoryFilterRegex?: string
  excludeToolsFilterRegex?: string
  includeToolsFilterRegex?: string
}

export type ToolWithCategory = Tool & { category: string };
