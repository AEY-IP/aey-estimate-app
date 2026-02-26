import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native'
import { Colors } from '../constants/colors'
import { MOCK_TECHNICAL_CARDS } from '../constants/mockData'
import { TechnicalCard } from '../types'

interface TechnicalCardDetailScreenProps {
  cardId: string
  onBack: () => void
}

export default function TechnicalCardDetailScreen({ 
  cardId, 
  onBack 
}: TechnicalCardDetailScreenProps) {
  const [card, setCard] = useState<TechnicalCard | null>(null)

  useEffect(() => {
    loadCardDetails()
  }, [cardId])

  const loadCardDetails = () => {
    const foundCard = MOCK_TECHNICAL_CARDS.find(c => c.id === cardId)
    setCard(foundCard || null)
  }

  const handleDownload = () => {
    Alert.alert('Скачано', 'Карта доступна для офлайн использования')
  }

  if (!card) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Карта не найдена</Text>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Назад</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Полы': '🔲',
      'Стены': '🧱',
      'Потолки': '⬜',
    }
    return icons[category] || '📋'
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Шапка */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backText}>Назад</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDownload} style={styles.downloadButton}>
          <Text style={styles.downloadIcon}>📥</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Заголовок карты */}
        <View style={styles.titleSection}>
          <Text style={styles.categoryIcon}>
            {getCategoryIcon(card.category)}
          </Text>
          <Text style={styles.title}>{card.title}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{card.category}</Text>
          </View>
        </View>

        {/* Описание */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Описание</Text>
          <Text style={styles.description}>{card.description}</Text>
        </View>

        {/* Этапы выполнения */}
        {card.steps && card.steps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              ✅ Этапы выполнения ({card.steps.length})
            </Text>
            <View style={styles.stepsList}>
              {card.steps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Медиа */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📷 Медиа материалы</Text>
          
          {card.images.length === 0 && !card.videoUrl && (
            <View style={styles.noMediaContainer}>
              <Text style={styles.noMediaIcon}>🖼️</Text>
              <Text style={styles.noMediaText}>
                Фото и видео будут добавлены позже
              </Text>
            </View>
          )}
          
          {card.images.length > 0 && (
            <View style={styles.mediaPlaceholder}>
              <Text style={styles.mediaPlaceholderText}>
                📷 {card.images.length} фото
              </Text>
            </View>
          )}
          
          {card.videoUrl && (
            <View style={styles.mediaPlaceholder}>
              <Text style={styles.mediaPlaceholderText}>🎥 Видео</Text>
            </View>
          )}
        </View>

        {/* Теги */}
        {card.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏷️ Теги</Text>
            <View style={styles.tagsContainer}>
              {card.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Нижний отступ */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backIcon: {
    fontSize: 24,
    color: Colors.text,
  },
  backText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
  },
  downloadButton: {
    padding: 8,
  },
  downloadIcon: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
  },
  titleSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.background,
  },
  categoryIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: Colors.background,
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  stepsList: {
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
    paddingTop: 4,
  },
  noMediaContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noMediaIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noMediaText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  mediaPlaceholder: {
    backgroundColor: Colors.backgroundGray,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  mediaPlaceholderText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.backgroundGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
})
