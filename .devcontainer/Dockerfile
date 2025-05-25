FROM mcr.microsoft.com/devcontainers/javascript-node:22

# Install Bun globally to /usr/local
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v1.2.14" \
    && mv /root/.bun /usr/local/bun \
    && ln -s /usr/local/bun/bin/bun /usr/local/bin/bun \
    && chmod +x /usr/local/bin/bun
    
# Copy node_modules from our public docker image so dependencies are cached
COPY --from=zachrebuild/revect.io:latest /app/node_modules /workspaces/revect/node_modules

# Verify installation
RUN bun --version