import { useAuth, useUser } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ErrorState, Heading, LoadingState, Page } from '@/components/Page';
import { RecordCard } from '@/components/RecordCard';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

type Profile={id:string;full_name:string;avatar_url:string|null;department:string|null;year_of_study:number|null};
type RoleGrant={roles:{name:string}|null;clubs:{name:string}|null};

export default function AccountScreen() {
  const {isLoaded,isSignedIn,signOut}=useAuth(); const {user}=useUser(); const router=useRouter();
  const [profile,setProfile]=useState<Profile|null>(null); const [roles,setRoles]=useState<string[]>([]); const [profileError,setProfileError]=useState('');
  useEffect(()=>{if(!isSignedIn||!user?.id)return;let active=true;
    async function loadAccount(){
      const p=await supabase.from('profiles').select('id,full_name,avatar_url,department,year_of_study').eq('clerk_user_id',user!.id).maybeSingle();
      if(!active)return;
      if(p.error)setProfileError('Your profile details are unavailable right now.');
      setProfile(p.data);
      if(!p.data?.id)return;
      const r=await supabase.from('user_role_assignments').select('roles(name),clubs(name)').eq('user_id',p.data.id);
      if(!active)return;
      setRoles((r.data??[]).map((grant)=>{const item=grant as unknown as RoleGrant;return [item.roles?.name,item.clubs?.name].filter(Boolean).join(' · ');}).filter(Boolean));
    }
    void loadAccount();return ()=>{active=false;};
  },[isSignedIn,user?.id]);
  if(!isLoaded)return <Page><LoadingState/></Page>;
  if(!isSignedIn)return <Page><Heading title="Your account" subtitle="Sign in with your existing Techtronica account."/>
    <Pressable style={styles.button} onPress={()=>router.push('/sign-in')}><Text style={styles.buttonText}>Sign in</Text></Pressable>
    <Pressable style={styles.secondary} onPress={()=>router.push('/sign-up')}><Text style={styles.secondaryText}>Create an account</Text></Pressable></Page>;
  return <Page><Heading title="Your account" subtitle="Your Techtronica identity and current access."/>
    <View style={styles.profile}>
      {user?.imageUrl?<Image source={{uri:user.imageUrl}} style={styles.avatar}/>:<View style={styles.avatarFallback}><Text style={styles.initial}>{(user?.firstName||user?.username||'T').slice(0,1).toUpperCase()}</Text></View>}
      <View style={styles.identity}><Text style={styles.name}>{profile?.full_name||user?.fullName||'Techtronica member'}</Text>
      <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress}</Text>
      <Text style={styles.email}>{profile?.department||'Techtronica account'}{profile?.year_of_study?' · Year '+profile.year_of_study:''}</Text></View>
    </View>
    {profileError?<ErrorState message={profileError}/>:null}
    <RecordCard title="Current role" detail={roles.length?roles.join('\n'):'No active role assignment found.'}/>
    <Pressable style={styles.secondary} onPress={()=>router.push('/profile')}><Text style={styles.secondaryText}>Profile settings</Text></Pressable>
    <Pressable style={styles.signout} onPress={()=>signOut()}><Text style={styles.signoutText}>Sign out</Text></Pressable>
  </Page>;
}
const styles=StyleSheet.create({
  profile:{flexDirection:'row',alignItems:'center',gap:14,backgroundColor:theme.surface,borderColor:theme.border,borderWidth:1,borderRadius:18,padding:16},
  avatar:{width:58,height:58,borderRadius:29},avatarFallback:{width:58,height:58,borderRadius:29,backgroundColor:theme.softBlue,alignItems:'center',justifyContent:'center'},
  initial:{color:theme.primary,fontSize:22,fontWeight:'800'},identity:{flex:1,gap:4},name:{color:theme.text,fontSize:17,fontWeight:'800'},email:{color:theme.muted,fontSize:13},
  button:{backgroundColor:theme.primary,alignItems:'center',padding:15,borderRadius:14},buttonText:{color:'#fff',fontSize:16,fontWeight:'800'},
  secondary:{backgroundColor:theme.surface,borderColor:theme.border,borderWidth:1,alignItems:'center',padding:14,borderRadius:14},secondaryText:{color:theme.text,fontSize:15,fontWeight:'700'},
  signout:{alignItems:'center',padding:14},signoutText:{color:theme.danger,fontSize:15,fontWeight:'800'}
});
