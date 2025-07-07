import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export const useCurrentUserName = () => {
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfileName = async () => {
      try {
        // Check if Supabase is configured before creating client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseAnonKey) {
          setName('?')
          return
        }

        const { data, error } = await createClient().auth.getSession()
        if (error) {
          console.error(error)
          setName('?')
          return
        }

        setName(data.session?.user.user_metadata.full_name ?? '?')
      } catch (error) {
        console.error('Error fetching user name:', error)
        setName('?')
      }
    }

    fetchProfileName()
  }, [])

  return name || '?'
}