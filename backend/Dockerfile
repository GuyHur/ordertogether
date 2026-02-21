FROM python:3.11-slim

# Install system dependencies that might be needed for compiling Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install uv for fast dependency management
RUN pip install uv

# Copy project files and install dependencies
COPY pyproject.toml uv.lock ./
# We use --system to install directly in the container's environment
RUN uv pip install --system -r pyproject.toml

# Copy application source code
COPY . .

# Ensure data directory and uploads directory exist
RUN mkdir -p data uploads/receipts

# Expose the API port
EXPOSE 8000

# Start the uvicorn server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
