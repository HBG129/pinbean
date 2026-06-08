import type { BeadGrid } from "../types/bead";

export type LocalProject = {
  id: string;
  title: string;
  grid: BeadGrid;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "bead-pixel-maker-projects";

export function getLocalProjects(): LocalProject[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as LocalProject[];
  } catch {
    return [];
  }
}

export function saveLocalProject(title: string, grid: BeadGrid) {
  const projects = getLocalProjects();

  const now = new Date().toISOString();

  const project: LocalProject = {
    id: crypto.randomUUID(),
    title,
    grid,
    createdAt: now,
    updatedAt: now,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify([project, ...projects]));

  return project;
}

export function deleteLocalProject(id: string) {
  const projects = getLocalProjects();
  const nextProjects = projects.filter((project) => project.id !== id);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProjects));
}