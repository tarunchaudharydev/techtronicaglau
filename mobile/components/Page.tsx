import type { PropsWithChildren } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/lib/theme';

export function Page({ children }: PropsWithChildren) {
  return <ScrollView contentContainerStyle={styles.content} style={styles.page}>{children}</ScrollView>;
}
export function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return <View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>;
}
export function LoadingState() {
  return <View style={styles.state}><ActivityIndicator color={theme.primary}/><Text style={styles.subtitle}>Loading…</Text></View>;
}
export function ErrorState({ message }: { message: string }) {
  return <Text accessibilityRole="alert" style={styles.error}>{message}</Text>;
}
const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:theme.background},content:{padding:20,paddingBottom:36,gap:16},
  heading:{gap:6,marginBottom:4},title:{color:theme.text,fontSize:28,fontWeight:'800',letterSpacing:-0.5},
  subtitle:{color:theme.muted,fontSize:15,lineHeight:22},state:{paddingVertical:36,alignItems:'center',gap:10},
  error:{color:theme.danger,backgroundColor:'#fff0f2',borderColor:'#ffd1d8',borderWidth:1,borderRadius:14,padding:14,lineHeight:21}
});
