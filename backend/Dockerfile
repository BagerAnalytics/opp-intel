FROM python:3.11-slim

# Install system dependencies including those required for Tailscale and Playwright
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    wget \
    git \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Tailscale
RUN curl -fsSL https://tailscale.com/install.sh | sh

# Set the working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright and its browser dependencies
RUN playwright install --with-deps chromium

# Copy the rest of the application code
COPY . .

# Make the start script executable
RUN chmod +x start.sh

# Expose the FastAPI port
EXPOSE 8000

# Start the application via the entrypoint script
CMD ["./start.sh"]
