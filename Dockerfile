FROM node:20-alpine

WORKDIR /app

# Install dev dependencies (nodemon) and app deps
COPY package*.json ./
RUN npm ci

# If you prefer nodemon global: RUN npm install -g nodemon
# Copy only when building image layer for deps (source will be mounted at runtime)
# Expose the port your app uses
EXPOSE 4000

CMD ["npm", "run", "dev"]
