# See https://github.com/devcontainers/images/tree/main/src/javascript-node for base image reference
FROM mcr.microsoft.com/devcontainers/javascript-node:latest

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
RUN adduser -D bun_user && \
    chown -R bun_user /root/.bun
RUN echo 'export PATH="/root/.bun/bin:$PATH"' >> /etc/bash.bashrc
RUN bun install