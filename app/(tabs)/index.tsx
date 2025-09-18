import React, { useState, Platform } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useProjects } from '../../hooks/useProjects';
import ProjectCard from '../../components/ui/ProjectCard';
import { Project } from '../../types';

export default function HomePage() {
  const { projects, loading, createProject, deleteProject } = useProjects();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectLocation, setNewProjectLocation] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectEngineer, setNewProjectEngineer] = useState('');
  const [newProjectForeman, setNewProjectForeman] = useState('');
  const [newProjectDate, setNewProjectDate] = useState(new Date().toISOString().split('T')[0]);
  const [newProjectLogo, setNewProjectLogo] = useState('');
  const [newProjectClientLogo, setNewProjectClientLogo] = useState('');

  // Alert web-compatible
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onOk?: () => void;
  }>({ visible: false, title: '', message: '' });

  const showWebAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      setAlertConfig({ visible: true, title, message, onOk });
    } else {
      Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      showWebAlert('Erro', 'Nome do projeto é obrigatório');
      return;
    }

    if (!newProjectLocation.trim()) {
      showWebAlert('Erro', 'Localização é obrigatória');
      return;
    }

    if (!newProjectEngineer.trim()) {
      showWebAlert('Erro', 'Nome do engenheiro é obrigatório');
      return;
    }

    if (!newProjectForeman.trim()) {
      showWebAlert('Erro', 'Nome do mestre de obra é obrigatório');
      return;
    }

    try {
      const project = await createProject({
        name: newProjectName.trim(),
        location: newProjectLocation.trim(),
        description: newProjectDescription.trim(),
        engineer: newProjectEngineer.trim(),
        foreman: newProjectForeman.trim(),
        evaluationDate: newProjectDate,
        isCompleted: false,
        logo: newProjectLogo,
        clientLogo: newProjectClientLogo,
      });

      setShowCreateModal(false);
      setNewProjectName('');
      setNewProjectLocation('');
      setNewProjectDescription('');
      setNewProjectEngineer('');
      setNewProjectForeman('');
      setNewProjectDate(new Date().toISOString().split('T')[0]);
      setNewProjectLogo('');
      setNewProjectClientLogo('');
      
      router.push(`/project/${project.id}`);
    } catch (error) {
      showWebAlert('Erro', 'Não foi possível criar o projeto');
    }
  };

  const handleSelectLogo = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showWebAlert('Permissão necessária', 'É necessário permitir acesso à galeria para selecionar logo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setNewProjectLogo(result.assets[0].uri);
      }
    } catch (error) {
      showWebAlert('Erro', 'Não foi possível selecionar a logo.');
    }
  };

  const handleSelectClientLogo = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showWebAlert('Permissão necessária', 'É necessário permitir acesso à galeria para selecionar logo do cliente.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setNewProjectClientLogo(result.assets[0].uri);
      }
    } catch (error) {
      showWebAlert('Erro', 'Não foi possível selecionar a logo do cliente.');
    }
  };

  const handleDeleteProject = (projectId: string) => {
    const confirmDelete = () => {
      deleteProject(projectId);
    };

    if (Platform.OS === 'web') {
      setAlertConfig({
        visible: true,
        title: 'Confirmar exclusão',
        message: 'Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.',
        onOk: confirmDelete
      });
    } else {
      Alert.alert(
        'Confirmar exclusão',
        'Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Excluir', style: 'destructive', onPress: confirmDelete }
        ]
      );
    }
  };

  const handleProjectPress = (project: Project) => {
    router.push(`/project/${project.id}`);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color="#94a3b8" />
      <Text style={styles.emptyTitle}>Nenhum projeto encontrado</Text>
      <Text style={styles.emptySubtitle}>
        Crie seu primeiro projeto de avaliação de segurança
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProjectCard
              project={item}
              onPress={handleProjectPress}
              onDelete={handleDeleteProject}
            />
          )}
          contentContainerStyle={[
            styles.listContainer,
            projects.length === 0 && styles.emptyListContainer
          ]}
          ListEmptyComponent={renderEmptyState}
        />

        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.cancelButton}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Novo Projeto</Text>
            <TouchableOpacity onPress={handleCreateProject}>
              <Text style={styles.saveButton}>Criar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nome do Projeto *</Text>
              <TextInput
                style={styles.input}
                value={newProjectName}
                onChangeText={setNewProjectName}
                placeholder="Ex: Obra Residencial ABC"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Localização *</Text>
              <TextInput
                style={styles.input}
                value={newProjectLocation}
                onChangeText={setNewProjectLocation}
                placeholder="Ex: Rua das Flores, 123"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Engenheiro Responsável *</Text>
              <TextInput
                style={styles.input}
                value={newProjectEngineer}
                onChangeText={setNewProjectEngineer}
                placeholder="Ex: João Silva"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mestre de Obra *</Text>
              <TextInput
                style={styles.input}
                value={newProjectForeman}
                onChangeText={setNewProjectForeman}
                placeholder="Ex: Carlos Santos"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Data da Avaliação *</Text>
              <TextInput
                style={styles.input}
                value={newProjectDate}
                onChangeText={setNewProjectDate}
                placeholder="AAAA-MM-DD"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newProjectDescription}
                onChangeText={setNewProjectDescription}
                placeholder="Descreva os detalhes do projeto..."
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Logo da Empresa</Text>
              <TouchableOpacity
                style={styles.logoSelector}
                onPress={handleSelectLogo}
              >
                {newProjectLogo ? (
                  <View style={styles.logoPreview}>
                    <Image source={{ uri: newProjectLogo }} style={styles.logoImage} />
                    <TouchableOpacity
                      style={styles.logoRemove}
                      onPress={() => setNewProjectLogo('')}
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Ionicons name="image-outline" size={32} color="#94a3b8" />
                    <Text style={styles.logoPlaceholderText}>
                      Selecionar Logo da Empresa
                    </Text>
                    <Text style={styles.logoHint}>
                      Recomendado: 400x200px
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Logo do Cliente</Text>
              <TouchableOpacity
                style={styles.logoSelector}
                onPress={handleSelectClientLogo}
              >
                {newProjectClientLogo ? (
                  <View style={styles.logoPreview}>
                    <Image source={{ uri: newProjectClientLogo }} style={styles.logoImage} />
                    <TouchableOpacity
                      style={styles.logoRemove}
                      onPress={() => setNewProjectClientLogo('')}
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Ionicons name="image-outline" size={32} color="#94a3b8" />
                    <Text style={styles.logoPlaceholderText}>
                      Selecionar Logo do Cliente
                    </Text>
                    <Text style={styles.logoHint}>
                      Recomendado: 400x200px
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {Platform.OS === 'web' && (
        <Modal visible={alertConfig.visible} transparent animationType="fade">
          <View style={styles.alertOverlay}>
            <View style={styles.alertContainer}>
              <Text style={styles.alertTitle}>{alertConfig.title}</Text>
              <Text style={styles.alertMessage}>{alertConfig.message}</Text>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => {
                  alertConfig.onOk?.();
                  setAlertConfig(prev => ({ ...prev, visible: false }));
                }}
              >
                <Text style={styles.alertButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  cancelButton: {
    fontSize: 16,
    color: '#64748b',
  },
  saveButton: {
    fontSize: 16,
    color: '#1e40af',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  logoSelector: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: 'white',
    minHeight: 120,
  },
  logoPreview: {
    position: 'relative',
    padding: 12,
    alignItems: 'center',
  },
  logoImage: {
    width: '100%',
    height: 100,
    borderRadius: 6,
    resizeMode: 'contain',
  },
  logoRemove: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  logoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoPlaceholderText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
    fontWeight: '500',
  },
  logoHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    minWidth: 280,
    maxWidth: 340,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e293b',
  },
  alertMessage: {
    fontSize: 16,
    marginBottom: 20,
    color: '#64748b',
    lineHeight: 22,
  },
  alertButton: {
    backgroundColor: '#1e40af',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  alertButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});