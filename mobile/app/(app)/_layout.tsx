import { Stack } from 'expo-router'

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#667eea'
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold'
        }
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: 'Meus Incidentes' }} />
      <Stack.Screen name="admin-dashboard" options={{ title: 'Dashboard Admin' }} />
      <Stack.Screen name="report-incident" options={{ title: 'Reportar Incidente' }} />
    </Stack>
  )
}
