import { useEffect, useState } from 'react';
import { ErrorState, Heading, LoadingState, Page } from '@/components/Page';
import { RecordCard } from '@/components/RecordCard';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';

type Event=Pick<Tables<'events'>,'id'|'title'|'summary'|'starts_at'|'venue'|'event_type'>;
export default function EventsScreen() {
  const [events,setEvents]=useState<Event[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
  useEffect(()=>{let active=true;
    supabase.from('events').select('id,title,summary,starts_at,venue,event_type').eq('status','published')
      .gte('starts_at',new Date().toISOString()).order('starts_at',{ascending:true}).limit(50)
      .then(({data,error:queryError})=>{if(!active)return;if(queryError)setError('Events could not be loaded. Check your connection and try again.');else setEvents(data??[]);setLoading(false);});
    return ()=>{active=false;};
  },[]);
  return <Page><Heading title="Events" subtitle="Published upcoming events from the society."/>
    {loading?<LoadingState/>:null}{error?<ErrorState message={error}/>:null}
    {!loading&&!error&&events.length===0?<RecordCard title="No upcoming events" detail="New published events will appear here."/>:null}
    {events.map(event=><RecordCard key={event.id} title={event.title} eyebrow={new Date(event.starts_at).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})} detail={[event.event_type,event.venue,event.summary].filter(Boolean).join(' · ')}/>)}
  </Page>;
}
