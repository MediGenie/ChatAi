<div><img width="200" alt="logo" src="https://github.com/taylormusolf/ChatAi/assets/71670060/0fda19e8-2bda-453c-8f45-12252ba59389"></div>
ChatAi is an application platform where you can create your own chatbot with whatever personality you like. 
<br />
You can chat your own chatbot creations or with ones built by other users.
<br />
<br />

Try out the app here on [Heroku!](https://chatai.taylormusolf.com/))

ChatAi is built using the MERN stack which utilizes React with Redux on the frontend and Node, Express and MongoDB on the backend.

## Technologies:

### Frontend
* `React` - Open source, component-based JavaScript/UI library
* `Redux` - Commonly used with React, Redux is also a JavaScript library with a primary function of handling application state
* `Fetch API` - JavaScript interface used to send promise-based, asynchronous HTTP requests to REST endpoints and perform CRUD operations

### Backend
* `Node` - Backend JavaScript runtime environment
* `Express` - Backend web application framework to build a RESTful API with Node
* `MongoDB` - Document-oriented database program
* `OpenAI API` - API service that provides access to OpenAI's language models which are designed to understand and generate human-like text
* `AWS S3` - Cloud service platform that assists in hosting image and other assests

## Features:
* User Authentication - users can sign up or log in to a corresponding user account or utilize the pre-created Demo User account
* Users can create, edit, delete and chat with custom chatbots that utilize `OpenAI API` for generating responses
* Users can discover existing chatbots through scrolling through featured chatbots on index page can query for others on the search page
* User Profile that shows all of signed in user's created chatbots and those they have chatted with
* Chatbot Options Menu can allow the user to use `OpenAI API` to generate a prompt to ask the chatbot, clear chat history with that chatbot, or create a clone of that chatbot


## Logging In to Chat with a Chatbot:
* A new user can either sign up or log in using the Demo User account
* Once logged in a user can start chatting with any existing chatbot
![login](https://github.com/taylormusolf/ChatAi/assets/71670060/24ea35d2-ce67-4433-beb3-30f131526ca7)


## Generating Chatbot Responses with OpenAI:
* Using OpenAI API the chatbot can dynamically generate responses to match the user's prompts
![chatting](https://github.com/taylormusolf/ChatAi/assets/71670060/6e9c82cb-bc7a-4642-ab73-5a95ba174732)



## Generating Chat Prompts with OpenAI:
* From the Chatbot Options Menu, the user can generate prompt suggestions generated by the OpenAI API

![prompt](https://github.com/taylormusolf/ChatAi/assets/71670060/fb2068bd-61f2-4136-b5a7-bf60b49ef31e)


## Future Implementations:
 - Battle feature where two bots can chat, debate or rap at each other
 - Voting system where users can upvote or downvote a chatbot to gauge popularity
 - Personality modifiers for chatbots
 - Chat with chatbots without logging in
 - More robust featured section that suggests chatbots and prompts to get a user engaged quickly
 - Generate profile images with OpenAI


