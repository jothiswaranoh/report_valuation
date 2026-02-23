FROM python:3.11-slim

WORKDIR /app

COPY . /app

RUN pip install --upgrade pip \
    && pip install --default-timeout=100 --no-cache-dir fastmcp pyyaml

EXPOSE 8001

CMD ["fastmcp", "run", "server.py", "--transport", "http", "--port", "8001"]