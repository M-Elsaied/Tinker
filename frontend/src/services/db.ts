import Dexie, { type Table } from 'dexie'
import type { Project } from '@/types'

class DoeLabDB extends Dexie {
  projects!: Table<Project, string>

  constructor() {
    super('doe-lab')
    this.version(1).stores({
      projects: 'id, name, updatedAt',
    })
  }
}

export const db = new DoeLabDB()

export async function saveProject(project: Project): Promise<void> {
  await db.projects.put({ ...project, updatedAt: Date.now() })
}

export async function loadProject(id: string): Promise<Project | undefined> {
  return db.projects.get(id)
}

export async function listProjects(): Promise<Project[]> {
  return db.projects.orderBy('updatedAt').reverse().toArray()
}

export async function deleteProject(id: string): Promise<void> {
  await db.projects.delete(id)
}
