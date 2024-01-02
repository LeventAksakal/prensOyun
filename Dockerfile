# Use an official Node.js runtime as the base image
FROM node:14

# Set the working directory in the container to /app
WORKDIR /app

# Copy the .env file into the Docker image
COPY .env ./

# Copy the rest of the server code to the server directory
COPY server/ ./server/

# Install the application dependencies
RUN npm install --prefix ./server

# Copy the rest of the client code to the client directory
COPY client/ ./client/

# Install the application dependencies
RUN npm install --prefix ./client && npm run build --prefix ./client

# Expose port 3000 for the application
EXPOSE 3000

# Define the command to run the application
CMD [ "node", "server/server.js" ]