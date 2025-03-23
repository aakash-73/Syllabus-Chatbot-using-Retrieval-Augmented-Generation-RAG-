from groq import Groq
import logging

GROQ_API_KEY = "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"

groq_client = Groq(api_key=GROQ_API_KEY)

chat_completion = groq_client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "Explain the importance of fast language models",
        }
    ],
    model="llama3-8b-8192",
)

print(chat_completion.choices[0].message.content)