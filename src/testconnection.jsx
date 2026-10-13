import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export default function TestConnection() {
  const [message, setMessage] = useState(
    isSupabaseConfigured ? 'Connecting...' : 'Supabase is not configured. Demo profiles are shown locally.'
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    async function test() {
      const { data, error } = await supabase
        .from('creators')
        .select('id, name')
        .limit(5);

      if (error) {
        setMessage('Error: ' + error.message);
      } else {
        setMessage(
          'Supabase connected! Creators found: ' + data.length
        );
      }
    }

    test();
  }, []);

  return <h2>{message}</h2>;
}