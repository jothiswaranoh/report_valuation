from openai import OpenAI

class LLMService:
  def __init__(self):
    self.client = OpenAI()

  def summarize(self, content: str) -> str:
    response = self.client.chat.completions.create(
      model="gpt-4o-mini",
      messages=[
        {
          "role": "system",
          "content": "You are a helpful assistant that summarizes text clearly and concisely."
        },
        {
          "role": "user",
          "content": content
        }
      ],
      temperature=0.3
    )

    return response.choices[0].message.content.strip()