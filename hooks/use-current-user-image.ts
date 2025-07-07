import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export const useCurrentUserImage = () => {
  const [image, setImage] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserImage = async () => {
      try {
        // Check if Supabase is configured before creating client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseAnonKey) {
          setImage(null)
          return
        }

        const { data, error } = await createClient().auth.getSession()
        if (error) {
          console.error(error)
          setImage(null)
          return
        }

        setImage(data.session?.user.user_metadata.avatar_url ?? null)
      } catch (error) {
        console.error('Error fetching user image:', error)
        setImage(null)
      }
    }
    
    fetchUserImage()
  }, [])

  return image
}