import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { createManualToolStreamResponse } from '@/lib/streaming/create-manual-tool-stream'
import { createToolCallingStreamResponse } from '@/lib/streaming/create-tool-calling-stream'
import { Model } from '@/lib/types/models'
import { isProviderEnabled } from '@/lib/utils/registry'

export const maxDuration = 30

const DEFAULT_MODEL: Model = {
  id: 'gemini-2.0-flash',
  name: 'Gemini 2.0 Flash',
  provider: 'Google Generative AI',
  providerId: 'google',
  enabled: true,
  toolCallType: 'manual'
}

export async function POST(req: Request) {
  try {
    // Debug environment variables
    console.log('Environment check:')
    console.log('GOOGLE_GENERATIVE_AI_API_KEY:', process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'Present' : 'Missing')
    console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Present' : 'Missing')
    console.log('TAVILY_API_KEY:', process.env.TAVILY_API_KEY ? 'Present' : 'Missing')
    
    const { messages, id: chatId } = await req.json()
    const referer = req.headers.get('referer')
    const isSharePage = referer?.includes('/share/')
    const userId = await getCurrentUserId()

    if (isSharePage) {
      return new Response('Chat API is not available on share pages', {
        status: 403,
        statusText: 'Forbidden'
      })
    }

    // Get cookies from the request headers instead of using the cookies() function
    const cookieHeader = req.headers.get('cookie')
    let selectedModel = DEFAULT_MODEL
    let searchMode = false

    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split('; ').map(cookie => {
          const [name, value] = cookie.split('=')
          return [name, decodeURIComponent(value)]
        })
      )

      if (cookies.selectedModel) {
        try {
          selectedModel = JSON.parse(cookies.selectedModel) as Model
          console.log('Selected model from cookie:', selectedModel)
        } catch (e) {
          console.error('Failed to parse selected model:', e)
        }
      }

      searchMode = cookies['search-mode'] === 'true'
    }

    console.log('Final selected model:', selectedModel)
    console.log('Provider enabled check:', isProviderEnabled(selectedModel.providerId))
    
    if (
      !isProviderEnabled(selectedModel.providerId) ||
      selectedModel.enabled === false
    ) {
      console.error(`Provider ${selectedModel.providerId} is not enabled or model is disabled`)
      return new Response(
        `Selected provider is not enabled ${selectedModel.providerId}`,
        {
          status: 404,
          statusText: 'Not Found'
        }
      )
    }

    const supportsToolCalling = selectedModel.toolCallType === 'native'

    return supportsToolCalling
      ? createToolCallingStreamResponse({
          messages,
          model: selectedModel,
          chatId,
          searchMode,
          userId
        })
      : createManualToolStreamResponse({
          messages,
          model: selectedModel,
          chatId,
          searchMode,
          userId
        })
  } catch (error) {
    console.error('API route error:', error)
    return new Response('Error processing your request', {
      status: 500,
      statusText: 'Internal Server Error'
    })
  }
}