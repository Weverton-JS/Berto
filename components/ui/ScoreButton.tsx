import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../../hooks/useTheme';

interface ScoreButtonProps {
  score: number | null;
  isSelected: boolean;
  onPress: (score: number | null) => void;
}

export default function ScoreButton({ score, isSelected, onPress }: ScoreButtonProps) {
  const colors = useThemeColors();

  const getScoreColor = (score: number | null) => {
    if (score === null) return colors.secondary || '#6b7280'; // Cinza para N/A
    if (score <= 2) return colors.error || '#ef4444'; // Vermelho
    if (score <= 3) return colors.warning || '#f59e0b'; // Amarelo
    return colors.success || '#10b981'; // Verde
  };

  const getScoreLabel = (score: number | null) => {
    if (score === null) return 'N/A';
    switch (score) {
      case 1: return 'Péssimo';
      case 2: return 'Ruim';
      case 3: return 'Regular';
      case 4: return 'Bom';
      case 5: return 'Excelente';
      default: return `${score}`;
    }
  };

  const getScoreDisplay = (score: number | null) => {
    return score === null ? 'N/A' : score.toString();
  };

  const scoreColor = getScoreColor(score);

  const styles = StyleSheet.create({
    button: {
      borderWidth: 2,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: 'center',
      minWidth: 60,
      backgroundColor: isSelected ? scoreColor : colors.surface,
      borderColor: scoreColor,
    },
    selectedButton: {
      borderWidth: 0,
      elevation: 3,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    scoreText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isSelected ? colors.onPrimary : scoreColor,
    },
    labelText: {
      fontSize: 10,
      fontWeight: '500',
      marginTop: 2,
      color: isSelected ? colors.onPrimary : colors.secondary,
    },
  });

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isSelected && styles.selectedButton,
      ]}
      onPress={() => onPress(score)}
    >
      <Text style={styles.scoreText}>
        {getScoreDisplay(score)}
      </Text>
      <Text style={styles.labelText}>
        {getScoreLabel(score)}
      </Text>
    </TouchableOpacity>
  );
}