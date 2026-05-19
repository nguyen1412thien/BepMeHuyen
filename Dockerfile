# Use the official lightweight Node.js 18 image on Alpine Linux
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy dependency definition files
COPY package*.json ./

# Install application dependencies (omit devDependencies for production runtime)
RUN npm ci --only=production

# Copy the rest of the application files (code, config, public assets)
COPY . .

# Expose the application port
EXPOSE 3000

# Run the app
CMD [ "node", "index.js" ]
