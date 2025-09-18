import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ScoreButtonProps {
  score: number | null;
  isSelected: boolean;
  onPress: (score: number | null) => void;
}

export default function ScoreButton({ score, isSelected, onPress }: ScoreButtonProps) {
  const getScoreColor = (score: number | null) => {
    if (score === null) return '#6b7280'; // Cinza para N/A
    if (score <= 2) return '#ef4444'; // Vermelho
    if (score <= 3) return '#f59e0b'; // Amarelo
    return '#10b981'; // Verde
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

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isSelected && styles.selectedButton,
        { borderColor: getScoreColor(score) },
        isSelected && { backgroundColor: getScoreColor(score) }
      ]}
      onPress={() => onPress(score)}
    >
      <Text style={[
        styles.scoreText,
        isSelected && styles.selectedText,
        { color: isSelected ? 'white' : getScoreColor(score) }
      ]}>
        {getScoreDisplay(score)}
      </Text>
      <Text style={[
        styles.labelText,
        isSelected && styles.selectedText,
        { color: isSelected ? 'white' : '#64748b' }
      ]}>
        {getScoreLabel(score)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    minWidth: 60,
    backgroundColor: 'white',
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
  },
  labelText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  selectedText: {
    color: 'white',
  },
});