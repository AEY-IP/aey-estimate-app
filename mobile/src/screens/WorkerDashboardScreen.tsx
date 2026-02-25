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
import { MOCK_WORKER, MOCK_TECHNICAL_CARDS } from '../constants/mockData'
import { TechnicalCard } from '../types'

interface WorkerDashboardScreenProps {
  workerId: string
  onLogout: () => void
  onCardPress: (cardId: string) => void
}

export default function WorkerDashboardScreen({ 
  workerId, 
  onLogout,
  onCardPress 
}: WorkerDashboardScreenProps) {
  const [cards, setCards] = useState<TechnicalCard[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTechnicalCards()
  }, [])

  const loadTechnicalCards = async () => {
    setIsLoading(true)
    // Симуляция загрузки данных
    setTimeout(() => {
      setCards(MOCK_TECHNICAL_CARDS)
      setIsLoading(false)
    }, 500)
  }

  const handleDownloadAll = () => {
    Alert.alert(
      'Скачать все карты?',
      `Будет скачано ${cards.length} технических карт для офлайн доступа`,
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Скачать', 
          onPress: () => {
            // TODO: реализовать офлайн кэширование
            Alert.alert('Успешно', 'Все карты скачаны для офлайн использования')
          }
        },
      ]
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Шапка с информацией о рабочем */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.workerInfo}>
              <Text style={styles.workerIcon}>👷</Text>
              <View>
                <Text style={styles.workerName}>{MOCK_WORKER.name}</Text>
                <Text style={styles.workerPhone}>{MOCK_WORKER.phone}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Выйти</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Информация об объекте */}
        <View style={styles.objectCard}>
          <View style={styles.objectHeader}>
            <Text style={styles.objectIcon}>📍</Text>
            <Text style={styles.objectTitle}>Текущий объект</Text>
          </View>
          <Text style={styles.objectName}>{MOCK_WORKER.clientName}</Text>
          <Text style={styles.objectAddress}>{MOCK_WORKER.objectAddress}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{cards.length}</Text>
              <Text style={styles.statLabel}>Доступно работ</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {cards.filter(c => c.downloaded).length}
              </Text>
              <Text style={styles.statLabel}>Скачано</Text>
            </View>
          </View>
        </View>

        {/* Кнопка скачать все */}
        <TouchableOpacity 
          style={styles.downloadAllButton}
          onPress={handleDownloadAll}
        >
          <Text style={styles.downloadAllIcon}>📥</Text>
          <Text style={styles.downloadAllText}>Скачать все для офлайн</Text>
        </TouchableOpacity>

        {/* Заголовок списка карт */}
        <View style={styles.cardsHeader}>
          <Text style={styles.cardsTitle}>📚 Технологические карты</Text>
          <Text style={styles.cardsCount}>{cards.length} шт.</Text>
        </View>

        {/* Список технологических карт */}
        <View style={styles.cardsList}>
          {cards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.techCard}
              onPress={() => onCardPress(card.id)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>
                  {getCategoryIcon(card.category)}
                </Text>
                <View style={styles.cardTitleContainer}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardCategory}>{card.category}</Text>
                </View>
              </View>
              
              <Text style={styles.cardDescription} numberOfLines={2}>
                {card.description}
              </Text>
              
              <View style={styles.cardFooter}>
                <View style={styles.cardMeta}>
                  {card.steps && (
                    <Text style={styles.cardMetaItem}>
                      📝 {card.steps.length} шагов
                    </Text>
                  )}
                  {card.images.length > 0 && (
                    <Text style={styles.cardMetaItem}>
                      📷 {card.images.length} фото
                    </Text>
                  )}
                  {card.videoUrl && (
                    <Text style={styles.cardMetaItem}>🎥 Видео</Text>
                  )}
                </View>
                <Text style={styles.cardArrow}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

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
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.background,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workerIcon: {
    fontSize: 40,
  },
  workerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  workerPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoutText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  objectCard: {
    backgroundColor: Colors.background,
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  objectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  objectIcon: {
    fontSize: 24,
  },
  objectTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  objectName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 6,
  },
  objectAddress: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  downloadAllButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  downloadAllIcon: {
    fontSize: 20,
  },
  downloadAllText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 16,
  },
  cardsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  cardsCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  cardsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  techCard: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 32,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  cardCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  cardMetaItem: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  cardArrow: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: 'bold',
  },
})
