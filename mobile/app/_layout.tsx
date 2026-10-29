import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { setClerkTokenProvider } from '@/lib/supabase';
import { theme } from '@/lib/theme';

const clerkKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
function SessionBridge() {
  const { getToken } = useAuth();
  // Register synchronously before route effects can issue their first Supabase request.
  setClerkTokenProvider(() => getToken());
  return <Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:theme.background}}}/>;
}
export default function RootLayout() {
  if (!clerkKey || !process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return <View style={styles.setup}><Text style={styles.title}>Connect Techtronica</Text><Text style={styles.body}>Copy mobile/.env.example to mobile/.env.local and add the existing website Clerk and Supabase public configuration.</Text></View>;
  }
  return <ClerkProvider publishableKey={clerkKey} tokenCache={tokenCache}><SessionBridge/></ClerkProvider>;
}
const styles=StyleSheet.create({setup:{flex:1,justifyContent:'center',padding:28,gap:12,backgroundColor:theme.background},title:{color:theme.text,fontSize:24,fontWeight:'800'},body:{color:theme.muted,fontSize:16,lineHeight:24}});
