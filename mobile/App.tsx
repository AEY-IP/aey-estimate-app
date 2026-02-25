import React, { useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import PinAuthScreen from './src/screens/PinAuthScreen'
import WorkerDashboardScreen from './src/screens/WorkerDashboardScreen'
import TechnicalCardDetailScreen from './src/screens/TechnicalCardDetailScreen'

type Screen = 'auth' | 'dashboard' | 'card-detail'

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('auth')
  const [workerId, setWorkerId] = useState<string | null>(null)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)

  const handleAuthenticated = (id: string) => {
    setWorkerId(id)
    setCurrentScreen('dashboard')
  }

  const handleLogout = () => {
    setWorkerId(null)
    setCurrentScreen('auth')
  }

  const handleCardPress = (cardId: string) => {
    setSelectedCardId(cardId)
    setCurrentScreen('card-detail')
  }

  const handleBackToDashboard = () => {
    setSelectedCardId(null)
    setCurrentScreen('dashboard')
  }

  return (
    <>
      <StatusBar style="dark" />
      
      {currentScreen === 'auth' && (
        <PinAuthScreen onAuthenticated={handleAuthenticated} />
      )}
      
      {currentScreen === 'dashboard' && workerId && (
        <WorkerDashboardScreen
          workerId={workerId}
          onLogout={handleLogout}
          onCardPress={handleCardPress}
        />
      )}
      
      {currentScreen === 'card-detail' && selectedCardId && (
        <TechnicalCardDetailScreen
          cardId={selectedCardId}
          onBack={handleBackToDashboard}
        />
      )}
    </>
  )
}
