import { useEffect, useState } from 'react';
import { ErrorState, Heading, LoadingState, Page } from '@/components/Page';
import { RecordCard } from '@/components/RecordCard';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';

type Club=Pick<Tables<'clubs'>,'id'|'name'|'tagline'|'description'|'focus_areas'>;
export default function ClubsScreen() {
  const [clubs,setClubs]=useState<Club[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
  useEffect(()=>{let active=true;
    supabase.from('clubs').select('id,name,tagline,description,focus_areas').eq('is_active',true).order('display_order')
      .then(({data,error:queryError})=>{if(!active)return;if(queryError)setError('Clubs could not be loaded. Check your connection and try again.');else setClubs(data??[]);setLoading(false);});
    return ()=>{active=false;};
  },[]);
  return <Page><Heading title="Explore clubs" subtitle="Find your community across Techtronica’s five clubs."/>
    {loading?<LoadingState/>:null}{error?<ErrorState message={error}/>:null}
    {!loading&&!error&&clubs.length===0?<RecordCard title="No clubs to show yet" detail="Check back later for active club information."/>:null}
    {clubs.map(club=><RecordCard key={club.id} title={club.name} eyebrow={club.focus_areas?.slice(0,3).join(' · ')} detail={club.tagline||club.description}/>)}
  </Page>;
}
