FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Viteのキャッシュディレクトリに書き込み権限を付与
RUN mkdir -p node_modules/.vite && chmod -R 777 node_modules/.vite

EXPOSE 5173

# ホストからアクセスできるようにホストを指定
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 