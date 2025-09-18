import { useState, useEffect } from 'react';
import { Evaluation, Answer } from '@/types';
import { SAFETY_QUESTIONS } from '@/constants/SafetyQuestions';
import StorageService from '@/services/StorageService';

export function useEvaluation(projectId: string) {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateScore = (answers: Answer[]) => {
    let totalScore = 0;
    let totalWeight = 0;

    answers.forEach(answer => {
      const question = SAFETY_QUESTIONS.find(q => q.id === answer.questionId);
      if (question && answer.score !== null) {
        totalScore += answer.score * question.weight;
        totalWeight += question.weight * 5; // Máximo possível para esta questão
      }
    });

    // Calcular pontuação total considerando apenas questões respondidas (não N/A)
    const maxPossibleScore = SAFETY_QUESTIONS.reduce((sum, question) => {
      const answer = answers.find(a => a.questionId === question.id);
      if (!answer || answer.score !== null) {
        return sum + (question.weight * 5);
      }
      return sum;
    }, 0);

    const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    return {
      totalScore,
      maxScore: maxPossibleScore,
      percentage
    };
  };

  const loadEvaluation = async () => {
    try {
      setLoading(true);
      setError(null);
      const evaluationData = await StorageService.getEvaluation(projectId);
      
      if (!evaluationData) {
        // Criar nova avaliação vazia
        const maxScore = SAFETY_QUESTIONS.reduce((sum, q) => sum + (q.weight * 5), 0);
        const newEvaluation: Evaluation = {
          projectId,
          answers: [],
          totalScore: 0,
          maxScore,
          percentage: 0
        };
        setEvaluation(newEvaluation);
      } else {
        setEvaluation(evaluationData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar avaliação');
    } finally {
      setLoading(false);
    }
  };

  const updateAnswer = async (questionId: string, score: number | null, notes?: string, images?: string[]) => {
    if (!evaluation) return;

    try {
      const updatedAnswers = [...evaluation.answers];
      const existingIndex = updatedAnswers.findIndex(a => a.questionId === questionId);
      
      const newAnswer: Answer = { questionId, score, notes, images };
      
      if (existingIndex >= 0) {
        updatedAnswers[existingIndex] = newAnswer;
      } else {
        updatedAnswers.push(newAnswer);
      }

      // Recalcular pontuação com novo sistema
      const { totalScore, maxScore, percentage } = calculateScore(updatedAnswers);

      const updatedEvaluation: Evaluation = {
        ...evaluation,
        answers: updatedAnswers,
        totalScore,
        maxScore,
        percentage
      };

      await StorageService.saveEvaluation(updatedEvaluation);
      setEvaluation(updatedEvaluation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar resposta');
      throw err;
    }
  };

  const completeEvaluation = async () => {
    if (!evaluation) return;

    try {
      const completedEvaluation: Evaluation = {
        ...evaluation,
        completedAt: new Date().toISOString()
      };

      await StorageService.saveEvaluation(completedEvaluation);
      setEvaluation(completedEvaluation);
      
      return completedEvaluation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao finalizar avaliação');
      throw err;
    }
  };

  const getAnswerForQuestion = (questionId: string): Answer | undefined => {
    return evaluation?.answers.find(a => a.questionId === questionId);
  };

  useEffect(() => {
    if (projectId) {
      loadEvaluation();
    }
  }, [projectId]);

  return {
    evaluation,
    loading,
    error,
    updateAnswer,
    completeEvaluation,
    getAnswerForQuestion,
    refreshEvaluation: loadEvaluation
  };
}