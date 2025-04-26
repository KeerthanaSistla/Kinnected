export async function generateGeminiResponse(message: string): Promise<string> {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      // If the server responded with an error status
      throw new Error(`Server error: ${res.status}`);
    }

    const data = await res.json();

    // Check if the response contains the expected data
    if (!data || !data.reply) {
      throw new Error('No valid reply found in the response');
    }

    return data.reply || "Sorry, I didn't understand that.";
  } catch (error) {
    console.error("Gemini chatbot error:", error);
    return "Oops, something went wrong.";
  }
}
