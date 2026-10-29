import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Heading, Page } from '@/components/Page';
import { RecordCard } from '@/components/RecordCard';
import { theme } from '@/lib/theme';

export default function HomeScreen() {
  return <Page>
    <View style={styles.hero}><Text style={styles.kicker}>TECHTRONICA · GLA UNIVERSITY</Text><Text style={styles.title}>Build. Learn. Belong.</Text><Text style={styles.copy}>Your society, clubs, events, and opportunities in one place.</Text></View>
    <Heading title="Explore Techtronica" subtitle="Quick access to what’s happening across the society."/>
    <Link href="/(tabs)/clubs" style={styles.link}><RecordCard title="Explore clubs" detail="Discover the five clubs and what they build." eyebrow="Community"/></Link>
    <Link href="/(tabs)/events" style={styles.link}><RecordCard title="Upcoming events" detail="See published events and their registration information." eyebrow="What’s on"/></Link>
    <Link href="/(tabs)/internships" style={styles.link}><RecordCard title="Internships" detail="Browse verified opportunities with official application links." eyebrow="Careers"/></Link>
    <Text style={styles.note}>Sign in to access member-only information and your account.</Text>
  </Page>;
}
const styles=StyleSheet.create({hero:{borderRadius:22,padding:22,gap:10,backgroundColor:'#10243c'},kicker:{color:'#a9dafa',fontSize:11,fontWeight:'800',letterSpacing:1},title:{color:'#fff',fontSize:30,fontWeight:'800',letterSpacing:-0.6},copy:{color:'#d4e0ee',fontSize:15,lineHeight:22,maxWidth:330},link:{textDecorationLine:'none'},note:{color:theme.muted,fontSize:13,textAlign:'center',paddingTop:4}});
