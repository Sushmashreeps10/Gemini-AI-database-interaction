import google.generativeai as genai

# Configure your Gemini API key
genai.configure(api_key="AIzaSyDrlydrKYnrUo6766y4MTjZM_tKc9Sjr_Y")

# Load the model
model = genai.GenerativeModel("models/gemini-2.5-flash")  # or any from list_models()

print("🤖 Gemini Chatbot (type 'exit' to quit)\n")

while True:
    user_input = input("You: ")
    if user_input.lower() == "exit":
        print("Bot: Goodbye 👋")
        break

    try:
        response = model.generate_content(user_input)
        print("Bot:", response.text)
    except Exception as e:
        print("Error:", e)