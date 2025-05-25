FROM mcr.microsoft.com/devcontainers/javascript-node:latest

# Switch to root to install Bun
USER root

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash

# Add Bun to PATH for all users
RUN ln -s /root/.bun/bin/bun /usr/local/bin/bun

# Switch back to the vscode user (default non-root user in dev containers)
USER vscode

# Verify installation
RUN bun --version