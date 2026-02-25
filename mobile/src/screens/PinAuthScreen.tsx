import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Vibration,
  Alert,
} from 'react-native'
import { Colors } from '../constants/colors'
import { MOCK_WORKER } from '../constants/mockData'

interface PinAuthScreenProps {
  onAuthenticated: (workerId: string) => void
}

export default function PinAuthScreen({ onAuthenticated }: PinAuthScreenProps) {
  const [pin, setPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleNumberPress = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num
      setPin(newPin)
      
      // Автоматическая проверка при вводе 6 цифр
      if (newPin.length === 6) {
        checkPin(newPin)
      }
    }
  }

  const handleDelete = () => {
    setPin(pin.slice(0, -1))
  }

  const checkPin = async (enteredPin: string) => {
    setIsLoading(true)
    
    // Симуляция проверки (пока используем моковые данные)
    setTimeout(() => {
      if (enteredPin === MOCK_WORKER.pin) {
        Vibration.vibrate(100) // Вибрация успеха
        onAuthenticated(MOCK_WORKER.id)
      } else {
        Vibration.vibrate([0, 100, 100, 100]) // Вибрация ошибки
        Alert.alert('Ошибка', 'Неверный PIN-код')
        setPin('')
      }
      setIsLoading(false)
    }, 500)
  }

  const renderDot = (index: number) => {
    const isFilled = index < pin.length
    return (
      <View
        key={index}
        style={[
          styles.dot,
          isFilled && styles.dotFilled,
        ]}
      />
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Логотип и заголовок */}
        <View style={styles.header}>
          <Text style={styles.logo}>Идеальный подрядчик</Text>
          <Text style={styles.subtitle}>Кабинет рабочего</Text>
        </View>

        {/* PIN индикаторы */}
        <View style={styles.pinContainer}>
          <Text style={styles.pinLabel}>Введите PIN-код</Text>
          <View style={styles.dotsContainer}>
            {[0, 1, 2, 3, 4, 5].map(renderDot)}
          </View>
        </View>

        {/* Клавиатура */}
        <View style={styles.keyboard}>
          <View style={styles.keyboardRow}>
            {['1', '2', '3'].map(num => (
              <TouchableOpacity
                key={num}
                style={styles.key}
                onPress={() => handleNumberPress(num)}
                disabled={isLoading}
              >
                <Text style={styles.keyText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.keyboardRow}>
            {['4', '5', '6'].map(num => (
              <TouchableOpacity
                key={num}
                style={styles.key}
                onPress={() => handleNumberPress(num)}
                disabled={isLoading}
              >
                <Text style={styles.keyText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.keyboardRow}>
            {['7', '8', '9'].map(num => (
              <TouchableOpacity
                key={num}
                style={styles.key}
                onPress={() => handleNumberPress(num)}
                disabled={isLoading}
              >
                <Text style={styles.keyText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.keyboardRow}>
            <View style={styles.key} />
            <TouchableOpacity
              style={styles.key}
              onPress={() => handleNumberPress('0')}
              disabled={isLoading}
            >
              <Text style={styles.keyText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.key}
              onPress={handleDelete}
              disabled={isLoading || pin.length === 0}
            >
              <Text style={styles.deleteText}>⌫</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Подсказка для тестирования */}
        {__DEV__ && (
          <View style={styles.devHint}>
            <Text style={styles.devHintText}>
              Тестовый PIN: {MOCK_WORKER.pin}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  pinContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  pinLabel: {
    fontSize: 18,
    color: Colors.text,
    marginBottom: 20,
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.borderDark,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  keyboard: {
    paddingHorizontal: 40,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 16,
  },
  key: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  keyText: {
    fontSize: 32,
    fontWeight: '600',
    color: Colors.text,
  },
  deleteText: {
    fontSize: 28,
    color: Colors.textSecondary,
  },
  devHint: {
    backgroundColor: Colors.warning,
    padding: 12,
    marginHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  devHintText: {
    color: Colors.background,
    fontWeight: '600',
    fontSize: 14,
  },
})
