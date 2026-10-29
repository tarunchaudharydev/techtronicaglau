import { Tabs } from 'expo-router';
import { theme } from '@/lib/theme';

export default function TabLayout() {
  return <Tabs screenOptions={{headerShown:false,tabBarActiveTintColor:theme.primary,tabBarInactiveTintColor:theme.muted,tabBarStyle:{height:64,paddingTop:8,paddingBottom:8,borderTopColor:theme.border,backgroundColor:theme.surface},tabBarLabelStyle:{fontSize:11,fontWeight:'700'}}}>
    <Tabs.Screen name="index" options={{title:'Home',tabBarLabel:'Home'}}/>
    <Tabs.Screen name="clubs" options={{title:'Clubs',tabBarLabel:'Clubs'}}/>
    <Tabs.Screen name="events" options={{title:'Events',tabBarLabel:'Events'}}/>
    <Tabs.Screen name="internships" options={{title:'Internships',tabBarLabel:'Internships'}}/>
    <Tabs.Screen name="account" options={{title:'Account',tabBarLabel:'Account'}}/>
  </Tabs>;
}
