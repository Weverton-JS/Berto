import { useState, useEffect } from 'react';
import { Project } from '@/types';
import StorageService from '@/services/StorageService';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const projectsData = await StorageService.getProjects();
      setProjects(projectsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar projetos');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newProject: Project = {
        ...projectData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await StorageService.saveProject(newProject);
      await loadProjects();
      return newProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar projeto');
      throw err;
    }
  };

  const updateProject = async (project: Project) => {
    try {
      await StorageService.saveProject(project);
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar projeto');
      throw err;
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      await StorageService.deleteProject(projectId);
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar projeto');
      throw err;
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects: loadProjects
  };
}