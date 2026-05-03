FROM node:20-slim

WORKDIR /app

# Cài Python
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-venv \
    python3-pip \
  && rm -rf /var/lib/apt/lists/*

# Tạo virtual environment 
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Cài thư viện Node
COPY package*.json ./
RUN npm install

# Cài thư viện Python 
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt


COPY . .
RUN npm run build

ENV NODE_ENV=production

CMD ["npm", "start"]