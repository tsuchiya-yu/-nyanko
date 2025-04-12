# コンテナ操作
build:
	docker compose build

up:
	docker compose up

down:
	docker compose down

app:
	docker compose exec web bash

ps:
	docker compose ps

logs:
	docker compose logs -f

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
deploy-ga-pageviews:
	supabase functions deploy ga-pageviews --no-verify-jwt

deploy-sitemap:
	supabase functions deploy generate-sitemap --no-verify-jwt

deploy-gemini:
	supabase functions deploy image-to-gemini --no-verify-jwt

.PHONY: build up down app ps logs lint format test test-coverage deploy-ga-pageviews deploy-sitemap deploy-gemini