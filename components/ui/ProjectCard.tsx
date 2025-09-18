import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  onPress: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

export default function ProjectCard({ project, onPress, onDelete }: ProjectCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = () => {
    if (project.isCompleted) return '#10b981';
    return '#f59e0b';
  };

  const getStatusText = () => {
    if (project.isCompleted) return 'Concluído';
    return 'Em andamento';
  };
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(project)}>
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
        <View style={styles.headerActions}>
          {project.logo && (
            <Image source={{ uri: project.logo }} style={styles.logoPreview} />
          )}
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => onDelete(project.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.projectName}>{project.name}</Text>
      <Text style={styles.projectLocation}>{project.location}</Text>
      <Text style={styles.projectEngineer}>Eng.: {project.engineer}</Text>
      <Text style={styles.projectForeman}>Mestre: {project.foreman}</Text>
      
      {project.description && (
        <Text style={styles.description} numberOfLines={2}>
          {project.description}
        </Text>
      )}

      <View style={styles.footer}>
        <Text style={styles.date}>
          Criado: {formatDate(project.createdAt)}
        </Text>
        {project.finalScore && (
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Nota:</Text>
            <Text style={[styles.score, { color: project.finalScore >= 70 ? '#10b981' : '#ef4444' }]}>
              {project.finalScore.toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
    headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoPreview: {
    width: 40,
    height: 20,
    borderRadius: 4,
    resizeMode: 'contain',
  },
  deleteButton: {
    padding: 4,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },  projectLocation: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  projectEngineer: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  projectForeman: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#94a3b8',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#64748b',
    marginRight: 4,
  },
  score: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});