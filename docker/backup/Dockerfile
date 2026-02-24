FROM alpine:3.19

# Install dependencies
RUN apk add --no-cache \
    bash \
    docker-cli \
    restic \
    curl \
    tzdata \
    openssl

# Configure timezone
ENV TZ=Europe/Istanbul

# Setup working directory
WORKDIR /app

# Copy scripts and crontab handled by docker-compose volumes
# but we can set up the entrypoint

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
