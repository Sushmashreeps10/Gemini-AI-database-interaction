import requests
import os

# The URL of your running FastAPI server's upload endpoint
url = "http://127.0.0.1:8000/api/upload"

# The name of the file you want to upload
filename = "Sheet1.xlsx"

# Check if the file exists in the current directory
if not os.path.exists(filename):
    print(f"Error: File '{filename}' not found in this directory.")
else:
    # 'rb' means read in binary mode
    with open(filename, 'rb') as f:
        # The key 'file' MUST match the parameter name in your FastAPI function
        files = {'file': (filename, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        
        print(f"Uploading {filename} to {url}...")
        
        try:
            # Send the POST request with the file
            response = requests.post(url, files=files)
            
            # Print the server's response
            print("\n--- Server Response ---")
            print(f"Status Code: {response.status_code}")
            print("JSON Response:")
            print(response.json())
            print("-----------------------")
            
        except requests.exceptions.ConnectionError as e:
            print("\n--- Connection Error ---")
            print("Could not connect to the server.")
            print("Please make sure your FastAPI server is running on http://127.0.0.1:8000")
            print("------------------------")