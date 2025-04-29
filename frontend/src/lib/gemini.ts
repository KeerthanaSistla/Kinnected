import api from '@/services/api';

export async function generateGeminiResponse(message: string): Promise<string> {
  try {
    console.log('Sending message to AI:', message);

    const response = await api.post('/api/ai/query', { 
      query: message 
    });

    if (response.data.success && response.data.response) {
      return response.data.response;
    }

    throw new Error(response.data.message || 'Invalid response from AI service');
  } catch (error: any) {
    console.error('AI service error:', error.response || error);
    
    if (error.response?.status === 401) {
      return 'Error: Please log in again to use the AI service.';
    }

    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'Failed to connect to AI service';
    
    return `Error: ${errorMessage}`;
  }
}
