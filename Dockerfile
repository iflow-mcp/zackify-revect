# Use the oven/bun image as the base image
FROM oven/bun:latest

# Set the working directory in the container
WORKDIR /app

# Copy the src folder to the container
COPY src src
# Copy the package.json and bun.lockb (if exists) to the container
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Expose the port the server will run on (change as needed)
EXPOSE 3000

# Command to start the server
CMD ["bun", "run", "start"]