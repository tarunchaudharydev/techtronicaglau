import { useHostedAuth } from '@clerk/expo/hosted-auth';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Heading, Page } from '@/components/Page';
import { theme } from '@/lib/theme';

export default function SignUpScreen() {
  const {startHostedAuth}=useHostedAuth(); const router=useRouter(); const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
  async function signUp() {
    setLoading(true); setError('');
    try { await startHostedAuth({mode:'sign-up'}); router.replace('/(tabs)/account'); }
    catch { setError('Sign-up did not finish. Please try again.'); }
    finally { setLoading(false); }
  }
  return <Page><Heading title="Join Techtronica" subtitle="Create an account using the website’s existing Clerk identity provider. An account alone does not grant society membership."/>
    {error?<Text accessibilityRole="alert" style={styles.error}>{error}</Text>:null}
    <Pressable accessibilityRole="button" disabled={loading} onPress={signUp} style={styles.button}><Text style={styles.buttonText}>{loading?'Opening secure sign-up…':'Continue to create account'}</Text></Pressable>
    <Pressable onPress={()=>router.replace('/sign-in')}><Text style={styles.link}>Already have an account? Sign in</Text></Pressable>
  </Page>;
}
const styles=StyleSheet.create({button:{backgroundColor:theme.primary,padding:16,borderRadius:14,alignItems:'center',marginTop:10},buttonText:{color:'#fff',fontWeight:'800',fontSize:16},link:{textAlign:'center',color:theme.primary,fontWeight:'700',padding:14},error:{color:theme.danger,backgroundColor:'#fff0f2',padding:14,borderRadius:12}});
