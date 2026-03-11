FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/dashboard/package.json apps/dashboard/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/connectors/package.json packages/connectors/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN npm install
COPY . .
CMD ["npm", "run", "dev:worker"]
