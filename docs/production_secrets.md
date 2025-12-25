# Production Secrets & Security Guide

This guide explains how to manage sensitive information (secrets) securely when deploying the Arkadaş Özel Eğitim ERP to production (Coolify).

## 1. Coolify Environment Variables
**NEVER** commit secrets to Git. Instead, inject them as environment variables in the Coolify dashboard.

### How to Migrate from `.env`
1.  Open your project in Coolify.
2.  Go to the **Environment Variables** tab of your service (or the main Docker Compose service).
3.  Copy values from your local `.env` file.
4.  **Important**: For multi-line values (like private keys), ensure they are properly escaped or handled by Coolify's UI.

### Key Secrets to Configure
| Variable | Description | Security Note |
| :--- | :--- | :--- |
| `JWT_SECRET` | Signs user sessions | Must be long and random |
| `APP_KEYS` | Strapi internal keys | 4 comma-separated secrets |
| `API_TOKEN_SALT` | Strapi API tokens | Random string |
| `POSTGRES_PASSWORD` | Database password | Use a generated strong password |
| `MEBBIS_PASSWORD` | External government system | **Highly Sensitive** |

### Ubuntu Server Setup Script (`setup_ubuntu_server.sh`)
The setup script detects if `.env` files already exist and **preserves** them to prevent accidental data loss (e.g., overwriting the database password).

#### How to Rotate Secrets Manually
If you need to change a secret (e.g., compromised database password):
1.  **Stop Services**: `pm2 stop all`
2.  **Edit Environment Files**:
    -   `strapi/.env`
    -   `ai-service/.env`
    -   `web/.env.local`
    -   `mebbis-service/.env`
3.  **Update Database**: If you changed the DB password, you must also update the PostgreSQL user password using `psql`.
    ```bash
    sudo -u postgres psql -c "ALTER USER strapi WITH ENCRYPTED PASSWORD 'NEW_PASSWORD';"
    ```
4.  **Restart Services**: `pm2 restart all`


## 2. Docker Socket Security
The script `configure_docker_socket.sh` is used to enable socket activation. In production:
-   **Restrict Access**: Only mounting the socket into the Coolify Agent container (or Portainer agent).
-   **Do NOT** expose TCP port 2375 to the internet.
-   **Do NOT** mount `/var/run/docker.sock` into application containers unless absolutely necessary (e.g., a CI runner).

## 3. Rate Limiting (DDoS Protection)
We have enabled application-level rate limiting:
-   **Mebbis Service**: Limited to 100 requests / 15 mins per IP.
-   **AI Service**: Limited to requests compliant with `slowapi` rules (default 50/min for endpoints).

> [!TIP]
> If you are behind Cloudflare, make sure to configure your Nginx/Traefik to pass the `CF-Connecting-IP` or `X-Forwarded-For` header correctly, otherwise rate limiting might block everyone sharing the proxy IP.
