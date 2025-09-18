import AsyncStorage from '@react-native-async-storage/async-storage';
import { Project, Evaluation, Answer } from '@/types';

class StorageService {
  private readonly PROJECTS_KEY = 'safety_projects';
  private readonly EVALUATIONS_KEY = 'safety_evaluations';

  // Projetos
  async getProjects(): Promise<Project[]> {
    try {
      const projectsJson = await AsyncStorage.getItem(this.PROJECTS_KEY);
      return projectsJson ? JSON.parse(projectsJson) : [];
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      return [];
    }
  }

  async saveProject(project: Project): Promise<void> {
    try {
      const projects = await this.getProjects();
      const existingIndex = projects.findIndex(p => p.id === project.id);
      
      if (existingIndex >= 0) {
        projects[existingIndex] = { ...project, updatedAt: new Date().toISOString() };
      } else {
        projects.push(project);
      }
      
      await AsyncStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
      throw error;
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      const projects = await this.getProjects();
      const filteredProjects = projects.filter(p => p.id !== projectId);
      await AsyncStorage.setItem(this.PROJECTS_KEY, JSON.stringify(filteredProjects));
      
      // Também remover avaliação associada
      await this.deleteEvaluation(projectId);
    } catch (error) {
      console.error('Erro ao deletar projeto:', error);
      throw error;
    }
  }

  // Avaliações
  async getEvaluation(projectId: string): Promise<Evaluation | null> {
    try {
      const evaluationsJson = await AsyncStorage.getItem(this.EVALUATIONS_KEY);
      const evaluations: Record<string, Evaluation> = evaluationsJson ? JSON.parse(evaluationsJson) : {};
      return evaluations[projectId] || null;
    } catch (error) {
      console.error('Erro ao carregar avaliação:', error);
      return null;
    }
  }

  async saveEvaluation(evaluation: Evaluation): Promise<void> {
    try {
      const evaluationsJson = await AsyncStorage.getItem(this.EVALUATIONS_KEY);
      const evaluations: Record<string, Evaluation> = evaluationsJson ? JSON.parse(evaluationsJson) : {};
      
      evaluations[evaluation.projectId] = evaluation;
      await AsyncStorage.setItem(this.EVALUATIONS_KEY, JSON.stringify(evaluations));
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      throw error;
    }
  }

  async deleteEvaluation(projectId: string): Promise<void> {
    try {
      const evaluationsJson = await AsyncStorage.getItem(this.EVALUATIONS_KEY);
      const evaluations: Record<string, Evaluation> = evaluationsJson ? JSON.parse(evaluationsJson) : {};
      
      delete evaluations[projectId];
      await AsyncStorage.setItem(this.EVALUATIONS_KEY, JSON.stringify(evaluations));
    } catch (error) {
      console.error('Erro ao deletar avaliação:', error);
      throw error;
    }
  }

  // Utilitários
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.PROJECTS_KEY, this.EVALUATIONS_KEY]);
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      throw error;
    }
  }
}

export default new StorageService();