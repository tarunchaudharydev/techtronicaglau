import { useUser } from '@clerk/expo';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Heading, Page } from '@/components/Page';
import { theme } from '@/lib/theme';

export default function ProfileScreen() {
  const {user}=useUser(); const [message,setMessage]=useState('');
  return <Page><Heading title="Profile settings" subtitle="Authentication details are managed by Clerk. Society profile fields are maintained by the Techtronica member portal."/>
    <View style={styles.identity}>{user?.imageUrl?<Image source={{uri:user.imageUrl}} style={styles.avatar}/>:null}<Text style={styles.name}>{user?.fullName||'Techtronica account'}</Text><Text style={styles.muted}>{user?.primaryEmailAddress?.emailAddress}</Text></View>
    <Text style={styles.label}>Name</Text><TextInput editable={false} value={user?.fullName||''} style={styles.input} accessibilityLabel="Name managed by Clerk"/>
    <Text style={styles.label}>Email</Text><TextInput editable={false} value={user?.primaryEmailAddress?.emailAddress||''} style={styles.input} accessibilityLabel="Email managed by Clerk"/>
    <Pressable style={styles.button} onPress={()=>setMessage('Use the secure account settings page to update your authentication details.')}><Text style={styles.buttonText}>Manage sign-in details</Text></Pressable>
    {message?<Text style={styles.muted}>{message}</Text>:null}
  </Page>;
}
const styles=StyleSheet.create({identity:{alignItems:'center',padding:20,gap:6,backgroundColor:theme.surface,borderColor:theme.border,borderWidth:1,borderRadius:18},avatar:{width:76,height:76,borderRadius:38},name:{color:theme.text,fontSize:18,fontWeight:'800'},muted:{color:theme.muted,lineHeight:21,textAlign:'center'},label:{color:theme.text,fontWeight:'700',marginBottom:-9},input:{backgroundColor:'#edf1f6',borderColor:theme.border,borderWidth:1,borderRadius:12,padding:13,color:theme.muted},button:{backgroundColor:theme.primary,borderRadius:14,alignItems:'center',padding:15},buttonText:{color:'#fff',fontWeight:'800'}});
