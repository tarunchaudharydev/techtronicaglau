import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text } from 'react-native';
import { ErrorState, Heading, LoadingState, Page } from '@/components/Page';
import { RecordCard } from '@/components/RecordCard';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import type { Tables } from '@/lib/database.types';

type Internship=Pick<Tables<'internships'>,'id'|'title'|'company_name'|'location_label'|'work_arrangement'|'application_url'|'deadline'>;
export default function InternshipsScreen() {
  const [listings,setListings]=useState<Internship[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
  useEffect(()=>{let active=true;
    supabase.from('internships').select('id,title,company_name,location_label,work_arrangement,application_url,deadline')
      .eq('listing_status','published').eq('verification_status','verified').order('published_at',{ascending:false}).limit(50)
      .then(({data,error:queryError})=>{if(!active)return;if(queryError)setError('Internships could not be loaded. Check your connection and try again.');else setListings(data??[]);setLoading(false);});
    return ()=>{active=false;};
  },[]);
  return <Page><Heading title="Internships" subtitle="Verified opportunities. Applications open on the employer’s official website."/>
    {loading?<LoadingState/>:null}{error?<ErrorState message={error}/>:null}
    {!loading&&!error&&listings.length===0?<RecordCard title="No verified listings yet" detail="Check back for new opportunities."/>:null}
    {listings.map(item=><Pressable key={item.id} accessibilityRole="link" onPress={()=>Linking.openURL(item.application_url)}>
      <RecordCard title={item.title} eyebrow={item.company_name} detail={[item.location_label,item.work_arrangement,item.deadline?'Apply by '+new Date(item.deadline).toLocaleDateString():null].filter(Boolean).join(' · ')}/>
      <Text style={styles.action}>Open official application ↗</Text>
    </Pressable>)}
  </Page>;
}
const styles=StyleSheet.create({action:{color:theme.primary,fontSize:13,fontWeight:'800',paddingHorizontal:14,paddingTop:8}});
