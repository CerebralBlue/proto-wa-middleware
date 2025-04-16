# WA Middleware Translation Layer

This project serves as a middleware translation layer between Proto/Codebaby Avatars and Watson Assistant, facilitating communication between these two systems.

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/CerebralBlue/proto-wa-middleware.git
cd proto-wa-middleware
```

### 2. Configure Environment Variables
Required values for the .env file (or OCP/Docker env vars):

```
WA_SERVICE_URL=https://api.us-south.assistant.watson.cloud.ibm.com/instances/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
WA_APIKEY=xxxxx
WA_ENV_ID=xxxxxx # assistant ID or environment ID
ACCESS_TOKEN=xxxxxx # set the access token for this server

SERVER_URL=http://localhost:3000 # this is only for the testing script
```

### 3. Build the Docker Image
Navigate to the project directory and build the Docker image:

docker build -t proto-wa-middleware .

### 4. Run the Docker Container
Once the Docker image is built, run it using the following command:

```bash
docker run -d -p 3000:3000 --name proto-wa-middleware-container proto-wa-middleware
```
