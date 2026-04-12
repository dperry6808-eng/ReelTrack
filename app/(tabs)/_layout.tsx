import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4a9eff',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: { backgroundColor: '#0a1628', borderTopColor: '#1a2a3a' },
        headerStyle: { backgroundColor: '#0a1628' },
        headerTintColor: '#fff',
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarLabel: 'Home' }} />
      <Tabs.Screen name="tournament" options={{ title: 'Tournament', tabBarLabel: 'Tournament' }} />
      <Tabs.Screen name="logcatch" options={{ title: 'Log Catch', tabBarLabel: 'Log Catch' }} />
      <Tabs.Screen name="today" options={{ title: 'Today', tabBarLabel: 'Today' }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarLabel: 'History' }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="cull" options={{ href: null }} />
    </Tabs>
  );
}
