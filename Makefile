# コンテナビルド
build:
	docker compose build

# 全サービス起動
up:
	@make supabase-start || true
	@make docker-up

# コンテナ クリーンアップ
clean:
	-docker compose down -v
	-supabase stop
	-docker volume rm supabase_db_cat_profile supabase_storage_cat_profile supabase_config_cat_profile 2>/dev/null || true
	-docker system prune -a -f

# Supabaseのみ起動
supabase-start:
	@if docker ps -a -q -f "name=supabase_.*_cat_profile" -f "status=exited" | grep -q .; then \
		if ! docker ps -a -q -f "name=supabase_.*_cat_profile" -f "status=exited" | xargs -r docker start; then \
			if docker info | grep -q "Operating System: Docker Desktop"; then \
				supabase start --ignore-health-check; \
			else \
				supabase start --ignore-health-check --exclude vector; \
			fi; \
		fi; \
		sleep 10; \
	else \
		if docker info | grep -q "Operating System: Docker Desktop"; then \
			supabase start --ignore-health-check; \
		else \
			supabase start --ignore-health-check --exclude vector; \
		fi; \
		sleep 10; \
	fi

# Dockerコンテナのみ起動
docker-up:
	docker compose up -d

# サービスの停止（コンテナを削除せず）
stop:
	-docker compose stop
	-docker ps -a | grep supabase_.*_cat_profile | awk '{print $$1}' | xargs -r docker stop

# 全サービス停止＆削除
down:
	-docker compose down
	-supabase stop

restart: down clean up

status:
	docker compose ps
	docker ps | grep supabase || echo "No Supabase containers running"
	docker volume ls | grep cat_profile

# Supabaseにデータをリストア
db-restore:
	docker exec -i supabase_db_cat_profile psql -U postgres -d postgres < production.sql

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

.PHONY: build up down restart status app ps logs lint format test test-coverage deploy-ga-pageviews deploy-sitemap deploy-gemini