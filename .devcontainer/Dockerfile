FROM mcr.microsoft.com/devcontainers/javascript-node:22
RUN apt update && apt install -y less \
  git \
  procps \
  sudo \
  fzf \
  zsh \
  man-db \
  unzip \
  gnupg2 \
  gh \
  iptables \
  ipset \
  iproute2 \
  dnsutils \
  aggregate \
  jq
COPY ./init-firewall.sh /usr/local/bin/
USER root
ARG USERNAME=node

# Persist bash history.
RUN SNIPPET="export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.bash_history" \
  && mkdir /commandhistory \
  && touch /commandhistory/.bash_history \
  && chown -R $USERNAME /commandhistory

ENV DEVCONTAINER=true

RUN mkdir -p /workspace /home/node/.claude && \
  chown -R node:node /workspace /home/node/.claude

RUN chmod +x /usr/local/bin/init-firewall.sh && \
  echo "node ALL=(root) NOPASSWD: /usr/local/bin/init-firewall.sh" > /etc/sudoers.d/node-firewall && \
  chmod 0440 /etc/sudoers.d/node-firewall

RUN npm install -g @anthropic-ai/claude-code

# Install Bun globally to /usr/local
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v1.2.14" \
    && mv /root/.bun /usr/local/bun \
    && ln -s /usr/local/bun/bin/bun /usr/local/bin/bun \
    && chmod +x /usr/local/bin/bun
    
# Copy node_modules from our public docker image so dependencies are cached
COPY --from=zachrebuild/revect.io:latest /app/node_modules /workspaces/revect/node_modules

# Verify installation
RUN bun --version

