FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    TF_CPP_MIN_LOG_LEVEL=3

RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY MULTILINGUAL_CHATBOT/requirements.txt MULTILINGUAL_CHATBOT/requirements.txt
RUN pip install --no-cache-dir wheel \
    && pip install --no-cache-dir -r MULTILINGUAL_CHATBOT/requirements.txt

COPY MULTILINGUAL_CHATBOT MULTILINGUAL_CHATBOT

RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('distiluse-base-multilingual-cased-v2')"

COPY package.json package-lock.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY . .

CMD ["sh", "scripts/start.sh"]