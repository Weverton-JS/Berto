import React, { useState, Platform } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEvaluation } from '@/hooks/useEvaluation';
import { useProjects } from '@/hooks/useProjects';
import { SAFETY_QUESTIONS, CATEGORY_NAMES } from '@/constants/SafetyQuestions';
import ScoreButton from '@/components/ui/ScoreButton';

export default function ProjectEvaluationPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { evaluation, updateAnswer, completeEvaluation, getAnswerForQuestion } = useEvaluation(id!);
  const { projects, updateProject } = useProjects();
  
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [currentQuestionNotes, setCurrentQuestionNotes] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState('');

  const project = projects.find(p => p.id === id);

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

  const toggleQuestionExpansion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const handleScoreChange = async (questionId: string, score: number | null) => {
    const existingAnswer = getAnswerForQuestion(questionId);
    await updateAnswer(
      questionId, 
      score, 
      existingAnswer?.notes, 
      existingAnswer?.images
    );
  };

  const openNotesModal = (questionId: string) => {
    const existingAnswer = getAnswerForQuestion(questionId);
    setCurrentQuestionId(questionId);
    setCurrentQuestionNotes(existingAnswer?.notes || '');
    setShowNotesModal(true);
  };

  const saveNotes = async () => {
    const existingAnswer = getAnswerForQuestion(currentQuestionId);
    if (existingAnswer) {
      await updateAnswer(
        currentQuestionId,
        existingAnswer.score,
        currentQuestionNotes,
        existingAnswer.images
      );
    }
    setShowNotesModal(false);
    setCurrentQuestionNotes('');
    setCurrentQuestionId('');
  };

  const openImageModal = (questionId: string) => {
    setCurrentQuestionId(questionId);
    setShowImageModal(true);
  };

  const takePicture = async () => {
    try {
      setShowImageModal(false);
      
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        showWebAlert('Permissão necessária', 'É necessário permitir acesso à câmera para tirar fotos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6, // Compressão automática
      });

      if (!result.canceled) {
        const existingAnswer = getAnswerForQuestion(currentQuestionId);
        const newImages = [...(existingAnswer?.images || []), result.assets[0].uri];
        
        await updateAnswer(
          currentQuestionId,
          existingAnswer?.score || 1,
          existingAnswer?.notes,
          newImages
        );
      }
    } catch (error) {
      showWebAlert('Erro', 'Não foi possível tirar a foto.');
    }
  };

  const selectFromGallery = async () => {
    try {
      setShowImageModal(false);
      
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showWebAlert('Permissão necessária', 'É necessário permitir acesso à galeria para selecionar fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7, // Compressão automática
      });

      if (!result.canceled) {
        const existingAnswer = getAnswerForQuestion(currentQuestionId);
        const newImages = [...(existingAnswer?.images || []), result.assets[0].uri];
        
        await updateAnswer(
          currentQuestionId,
          existingAnswer?.score || 1,
          existingAnswer?.notes,
          newImages
        );
      }
    } catch (error) {
      showWebAlert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const handleCompleteEvaluation = async () => {
    if (!evaluation || !project) return;

    // Verificar se todas as questões foram respondidas (exceto N/A)
    const unansweredQuestions = SAFETY_QUESTIONS.filter(q => {
      const answer = getAnswerForQuestion(q.id);
      return !answer; // Sem resposta nenhuma
    });

    if (unansweredQuestions.length > 0) {
      showWebAlert(
        'Avaliação incompleta',
        `Ainda faltam ${unansweredQuestions.length} questões para responder.`
      );
      return;
    }

    try {
      const completedEvaluation = await completeEvaluation();
      if (completedEvaluation) {
        // Atualizar projeto como concluído
        await updateProject({
          ...project,
          isCompleted: true,
          finalScore: completedEvaluation.percentage
        });

        showWebAlert(
          'Avaliação concluída!',
          `Nota final: ${completedEvaluation.percentage.toFixed(1)}%`,
          () => router.back()
        );
      }
    } catch (error) {
      showWebAlert('Erro', 'Não foi possível finalizar a avaliação.');
    }
  };

  const handleGeneratePDF = async () => {
    if (!evaluation || !project) return;

    // Verificar se a avaliação está completa
    const unansweredQuestions = SAFETY_QUESTIONS.filter(q => {
      const answer = getAnswerForQuestion(q.id);
      return !answer; // Sem resposta nenhuma
    });

    if (unansweredQuestions.length > 0) {
      showWebAlert(
        'Avaliação incompleta',
        'Complete todas as questões antes de gerar o relatório PDF.'
      );
      return;
    }

    try {
      const PDFService = (await import('@/services/PDFService')).default;
      await PDFService.generatePDF(project, evaluation);
      showWebAlert('Sucesso!', 'Relatório PDF gerado e compartilhado com sucesso.');
    } catch (error) {
      showWebAlert('Erro', 'Não foi possível gerar o relatório PDF.');
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (percentage: number) => {
    if (percentage >= 80) return 'Excelente';
    if (percentage >= 60) return 'Satisfatório';
    return 'Inadequado';
  };

  if (!project || !evaluation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Projeto não encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header com informações do projeto */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.projectInfo}>
            <Text style={styles.projectTitle}>{project.name}</Text>
            <Text style={styles.projectLocation}>{project.location}</Text>
            
            <View style={styles.projectDetails}>
              <Text style={styles.projectDetail}>Eng.: {project.engineer}</Text>
              <Text style={styles.projectDetail}>Mestre: {project.foreman}</Text>
              <Text style={styles.projectDetail}>Data: {new Date(project.evaluationDate).toLocaleDateString('pt-BR')}</Text>
            </View>
          </View>
          
          {project.clientLogo && (
            <View style={styles.clientLogoContainer}>
              <Image source={{ uri: project.clientLogo }} style={styles.clientLogo} />
            </View>
          )}
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Progresso atual:</Text>
          <Text style={[styles.score, { color: getScoreColor(evaluation.percentage) }]}>
            {evaluation.percentage.toFixed(1)}% - {getScoreLabel(evaluation.percentage)}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Questões por categoria */}
        {Object.entries(CATEGORY_NAMES).map(([category, categoryName]) => {
          const categoryQuestions = SAFETY_QUESTIONS.filter(q => q.category === category);
          
          return (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{categoryName}</Text>
              
              {categoryQuestions.map((question) => {
                const answer = getAnswerForQuestion(question.id);
                const isExpanded = expandedQuestions.has(question.id);
                
                return (
                  <View key={question.id} style={styles.questionCard}>
                    <TouchableOpacity 
                      onPress={() => toggleQuestionExpansion(question.id)}
                      style={styles.questionHeader}
                    >
                      <Text style={styles.questionText}>{question.question}</Text>
                      <View style={styles.questionMeta}>
                        <Text style={styles.weightText}>Peso: {question.weight}</Text>
                        <Ionicons 
                          name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                          size={20} 
                          color="#64748b" 
                        />
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.questionContent}>
                        {/* Botões de pontuação incluindo N/A */}
                        <View style={styles.scoresContainer}>
                          {[1, 2, 3, 4, 5, null].map(score => (
                            <ScoreButton
                              key={score || 'na'}
                              score={score}
                              isSelected={answer?.score === score}
                              onPress={(score) => handleScoreChange(question.id, score)}
                            />
                          ))}
                        </View>

                        {/* Ações adicionais */}
                        <View style={styles.actionsContainer}>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => openNotesModal(question.id)}
                          >
                            <Ionicons name="document-text-outline" size={18} color="#1e40af" />
                            <Text style={styles.actionText}>
                              {answer?.notes ? 'Editar Nota' : 'Adicionar Nota'}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => openImageModal(question.id)}
                          >
                            <Ionicons name="camera-outline" size={18} color="#1e40af" />
                            <Text style={styles.actionText}>Adicionar Foto</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Indicadores de conteúdo adicional */}
                        <View style={styles.contentIndicators}>
                          {answer?.notes && (
                            <View style={styles.indicator}>
                              <Ionicons name="document-text" size={16} color="#10b981" />
                              <Text style={styles.indicatorText}>Nota adicionada</Text>
                            </View>
                          )}
                          {answer?.images && answer.images.length > 0 && (
                            <View style={styles.indicator}>
                              <Ionicons name="camera" size={16} color="#10b981" />
                              <Text style={styles.indicatorText}>
                                {answer.images.length} foto(s)
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      {/* Botões de ação */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.pdfButton} onPress={handleGeneratePDF}>
          <Text style={styles.pdfButtonText}>Gerar PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.completeButton} onPress={handleCompleteEvaluation}>
          <Text style={styles.completeButtonText}>Finalizar Avaliação</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de notas */}
      <Modal visible={showNotesModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNotesModal(false)}>
              <Text style={styles.modalCancelButton}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Adicionar Nota</Text>
            <TouchableOpacity onPress={saveNotes}>
              <Text style={styles.modalSaveButton}>Salvar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.notesInput}
              value={currentQuestionNotes}
              onChangeText={setCurrentQuestionNotes}
              placeholder="Digite suas observações sobre este item..."
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal de seleção de imagem */}
      <Modal visible={showImageModal} transparent animationType="fade">
        <View style={styles.imageModalOverlay}>
          <View style={styles.imageModalContainer}>
            <Text style={styles.imageModalTitle}>Adicionar Foto</Text>
            <Text style={styles.imageModalSubtitle}>Como deseja adicionar a imagem?</Text>
            
            <View style={styles.imageOptionsContainer}>
              <TouchableOpacity style={styles.imageOption} onPress={takePicture}>
                <Ionicons name="camera" size={32} color="#1e40af" />
                <Text style={styles.imageOptionText}>Tirar Foto</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.imageOption} onPress={selectFromGallery}>
                <Ionicons name="images" size={32} color="#1e40af" />
                <Text style={styles.imageOptionText}>Escolher da Galeria</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.imageCancelButton} 
              onPress={() => setShowImageModal(false)}
            >
              <Text style={styles.imageCancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Alert Web Compatible */}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  projectInfo: {
    flex: 1,
    marginRight: 16,
  },
  clientLogoContainer: {
    width: 80,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientLogo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    borderRadius: 4,
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  projectLocation: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  projectDetails: {
    marginBottom: 12,
  },
  projectDetail: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  score: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  categorySection: {
    marginTop: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#eff6ff',
    marginBottom: 8,
  },
  questionCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  questionHeader: {
    padding: 16,
  },
  questionText: {
    fontSize: 16,
    color: '#1e293b',
    lineHeight: 22,
    marginBottom: 8,
  },
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weightText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  questionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  actionText: {
    fontSize: 14,
    color: '#1e40af',
    marginLeft: 6,
    fontWeight: '500',
  },
  contentIndicators: {
    flexDirection: 'row',
    gap: 12,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorText: {
    fontSize: 12,
    color: '#10b981',
    marginLeft: 4,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    gap: 12,
  },
  pdfButton: {
    flex: 1,
    backgroundColor: '#1e40af',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  pdfButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal styles
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
  modalCancelButton: {
    fontSize: 16,
    color: '#64748b',
  },
  modalSaveButton: {
    fontSize: 16,
    color: '#1e40af',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
    height: 200,
    textAlignVertical: 'top',
  },
  // Image modal styles
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    minWidth: 280,
    maxWidth: 340,
  },
  imageModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#1e293b',
  },
  imageModalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  imageOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  imageOption: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    minWidth: 100,
  },
  imageOptionText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  imageCancelButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  imageCancelButtonText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  // Alert styles
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
  errorText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
});