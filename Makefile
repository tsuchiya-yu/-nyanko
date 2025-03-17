build:
	docker compose build

up:
	docker compose up

down:
	docker compose down

app:
	docker compose exec web bash

# 静的解析とフォーマット
lint:
	docker compose exec web npm run lint:fix

format:
	docker compose exec web npm run format

# テスト実行
test:
	docker compose exec web npm test

test-coverage:
	docker compose exec web npm run test:coverage

# Supabase Functions デプロイ
deploy-function:
	supabase functions deploy image-to-gemini --no-verify-jwt