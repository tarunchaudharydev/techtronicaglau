import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/lib/theme';

export function RecordCard({ title, detail, eyebrow }: { title:string; detail?:string|null; eyebrow?:string|null }) {
  return <View style={styles.card}>{eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}<Text style={styles.title}>{title}</Text>{detail ? <Text style={styles.detail}>{detail}</Text> : null}</View>;
}
const styles=StyleSheet.create({
  card:{backgroundColor:theme.surface,borderColor:theme.border,borderWidth:1,borderRadius:16,padding:16,gap:7},
  eyebrow:{color:theme.primary,fontSize:12,fontWeight:'800',textTransform:'uppercase',letterSpacing:0.7},
  title:{color:theme.text,fontSize:17,fontWeight:'700'},detail:{color:theme.muted,fontSize:14,lineHeight:20}
});
