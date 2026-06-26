FROM node:22-alpine

WORKDIR /app

# Copy package configurations and install dependencies
COPY package.json .
RUN npm install

# Copy source assets
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
