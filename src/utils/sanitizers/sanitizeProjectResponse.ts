import type { SanitizedProjectList, SanitizedProjectDetail } from '@app-types/Project.js';
import type { Project } from '@models/Project.js';

export type { SanitizedProjectList, SanitizedProjectDetail };

const sanitizeProjectResponse = ({
  project,
  type = 'getProjectById',
}: {
  project: Project;
  type: 'getProjects' | 'getProjectById';
}): SanitizedProjectList | SanitizedProjectDetail => {
  switch (type) {
    case 'getProjects':
      return {
        id: project._id.toString(),
        title: project.title,
        description: project.description,
        visibility: project.visibility,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };

    case 'getProjectById':
      return {
        id: project._id.toString(),
        title: project.title,
        description: project.description,
        visibility: project.visibility,
        status: project.status,
        defaultContextProfileId: project.defaultContextProfileId,
        generationCounts: project.generationCounts,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };

    default:
      return {
        id: project._id.toString(),
        title: project.title,
        description: project.description,
        visibility: project.visibility,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
  }
};

const sanitizeProjects = (projects: Project[]): SanitizedProjectList[] =>
  projects.map((project) => ({
    id: project._id.toString(),
    title: project.title,
    description: project.description,
    visibility: project.visibility,
    status: project.status,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }));

export { sanitizeProjectResponse, sanitizeProjects };
