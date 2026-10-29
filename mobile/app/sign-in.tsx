import { useHostedAuth } from '@clerk/expo/hosted-auth';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Heading, Page } from '@/components/Page';
import { theme } from '@/lib/theme';

export default function SignInScreen() {
  const {startHostedAuth}=useHostedAuth(); const router=useRouter(); const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
  async function signIn() {
    setLoading(true); setError('');
    try { await startHostedAuth({mode:'sign-in'}); router.replace('/(tabs)/account'); }
    catch { setError('Sign-in did not finish. Please try again.'); }
    finally { setLoading(false); }
  }
  return <Page><Heading title="Welcome back" subtitle="Continue with the same account you use on the Techtronica website."/>
    {error?<Text accessibilityRole="alert" style={styles.error}>{error}</Text>:null}
    <Pressable accessibilityRole="button" disabled={loading} onPress={signIn} style={styles.button}><Text style={styles.buttonText}>{loading?'Opening secure sign-in…':'Continue to sign in'}</Text></Pressable>
    <Pressable onPress={()=>router.replace('/sign-up')}><Text style={styles.link}>New to Techtronica? Create an account</Text></Pressable>
  </Page>;
}
const styles=StyleSheet.create({button:{backgroundColor:theme.primary,padding:16,borderRadius:14,alignItems:'center',marginTop:10},buttonText:{color:'#fff',fontWeight:'800',fontSize:16},link:{textAlign:'center',color:theme.primary,fontWeight:'700',padding:14},error:{color:theme.danger,backgroundColor:'#fff0f2',padding:14,borderRadius:12}});
