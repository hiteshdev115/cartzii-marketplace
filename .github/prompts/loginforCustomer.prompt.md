---
name: loginforCustomer
description: I want to build login functionality in login page
---

<!-- Tip: Use /create-prompt in chat to generate content with agent assistance -->

# Use below api to make login functionality
API: POST api/v1/login
Payload: {
    "email": "hitesh.er8@gmail.com",
    "password": "123456"
}

if email and password are correct and user is authenticated successfully then response will be like below

Sample Response:
  {
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImhrLjEyMTk4OEBnbWFpbC5jb20iLCJpYXQiOjE3NzYzODkxNzMsImV4cCI6MTc3NjM5Mjc3MywiaXNzIjoiY2FydHppaS5jb20ifQ.C4LmfEAANLTxY5mZ96pYTbxP7dRK8kMUS0VDFr6PYjk",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImhrLjEyMTk4OEBnbWFpbC5jb20iLCJ0eXBlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NzYzODkxNzMsImV4cCI6MTc3Njk5Mzk3MywiaXNzIjoiY2FydHppaS5jb20ifQ.FUjazU9Vgt2kogEmCwhQ8Z2ofW-hNWMtBaDgZAP2OA8"
}

if incorrect email or password

sample Response: 
  {
      "success": false,
      "errorCode": 1007,
      "message": "Invalid credentials"
  }

if user is registered with email but not verified email then response will be like below

sample Response:
  {
      "success": false,
      "errorCode": 1013,
      "message": "Sorry, Your account is not verified please verify before login!"
  }

# Please use above API and implement login functionality in login page.
# Use above token and store it and use it for authentication in other API calls.

# Extract the token from response and store it in local storage or cookies for future use in authentication for other API calls.
# Handle error responses and display appropriate messages to the user based on the error code received from the API.
# Implement form validation to ensure that the email and password fields are not empty before making the API call.
# Provide feedback to the user during the login process, such as showing a loading spinner while the API call is in progress and displaying success or error messages based on the response received from the API.

# Ensure that the login functionality is secure by using HTTPS for API calls and implementing proper error handling to prevent exposing sensitive information in error messages.

# Test the login functionality thoroughly to ensure that it works as expected in different scenarios, such as successful login, incorrect credentials, and unverified accounts.

# after successful login, redirect the user to the home page




