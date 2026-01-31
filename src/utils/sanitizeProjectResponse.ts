import { Project } from '@models/Project.js';

interface ProjectResponse {
  project: Project;
  type: 'getProjects' | 'getProjectById';
}

const sanitizeProjectResponse = ({ project, type = 'getProjectById' }: ProjectResponse) => {
  switch (type) {
    case 'getProjects':
      return {
        _id: project._id,
        title: project.title,
        description: project.description,
        visibility: project.visibility,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    case 'getProjectById':
      return {
        _id: project._id,
        title: project.title,
        description: project.description,
        visibility: project.visibility,
        status: project.status,
        contextProfileId: project.defaultContextProfileId,
        generationCounts: project.generationCounts,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    default:
      return project;
  }
};

const sanitizeProjects = (projects: Project[]) => {
  return projects.map((project) => sanitizeProjectResponse({ project, type: 'getProjects' }));
};

export { sanitizeProjectResponse, sanitizeProjects };
