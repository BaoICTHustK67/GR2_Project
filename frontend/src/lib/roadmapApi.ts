import api from '@/lib/api'

export interface RoadmapStep {
  id: string
  title: string
  description: string
  duration: string
  skills: string[]
  resources: Array<{ title: string; url: string }>
  completed: boolean
}

export interface RoadmapTemplate {
  id: number
  role: string
  level: string
  description: string
  coverImage: string
  estimatedDuration: string
  steps: RoadmapStep[]
  skillsCovered: string[]
  isActive: boolean
  createdAt: string
}

export interface UserRoadmap {
  id: number
  userId: number
  templateId?: number
  title: string
  targetRole: string
  targetLevel: string
  steps: RoadmapStep[]
  progress: number
  isAiGenerated: boolean
  createdAt: string
  updatedAt: string
}

export const roadmapApi = {
  getTemplates: () => 
    api.get<{ success: boolean; templates: RoadmapTemplate[] }>('/roadmaps/templates'),

  getTemplate: (id: number) => 
    api.get<{ success: boolean; template: RoadmapTemplate }>(`/roadmaps/templates/${id}`),

  getMyRoadmaps: () => 
    api.get<{ success: boolean; roadmaps: UserRoadmap[] }>('/roadmaps/my'),

  generateRoadmap: (data: { 
    targetRole: string
    targetLevel: string
    useProfile: boolean
    additionalContext?: string 
  }) => 
    api.post<{ success: boolean; roadmap: any }>('/roadmaps/generate', data),

  saveRoadmap: (data: Partial<UserRoadmap>) => 
    api.post<{ success: boolean; roadmap: UserRoadmap }>('/roadmaps/save', data),

  updateProgress: (id: number, steps: RoadmapStep[]) => 
    api.put<{ success: boolean; roadmap: UserRoadmap }>(`/roadmaps/${id}/progress`, { steps }),

  deleteRoadmap: (id: number) => 
    api.delete<{ success: boolean }>(`/roadmaps/${id}`),
}
