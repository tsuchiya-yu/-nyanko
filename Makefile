# コンテナビルド
build:
	docker compose build

# 全サービス起動
up:
	@make supabase-start
	@make docker-up
	@if [ -f /tmp/supabase_functions.pid ] && ps -p $$(cat /tmp/supabase_functions.pid) -o comm= | grep -q "deno"; then \
		echo "Supabase Edge Functions (PID $$(cat /tmp/supabase_functions.pid)) は既に実行中です。"; \
	else \
		rm -f /tmp/supabase_functions.pid; \
		nohup supabase functions serve --env-file .env > /tmp/supabase_functions.log 2>&1 & echo $$! > /tmp/supabase_functions.pid \
	fi

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
	else \
		if docker info | grep -q "Operating System: Docker Desktop"; then \
			supabase start --ignore-health-check; \
		else \
			supabase start --ignore-health-check --exclude vector; \
		fi; \
	fi

# Dockerコンテナのみ起動
docker-up:
	docker compose up -d

# サービスの停止（コンテナを削除せず）
stop:
	-docker compose stop
	-docker ps -a | grep supabase_.*_cat_profile | awk '{print $$1}' | xargs -r docker stop
	@make _stop-edge-functions

# 全サービス停止＆削除
down:
	-docker compose down
	-supabase stop
	@make _stop-edge-functions

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

# Supabase Functions 実行（ローカル環境用）
functions-serve:
	supabase functions serve --env-file .env

#  Edge Functions の停止（ローカル環境用）
_stop-edge-functions:
	@echo "Supabase Edge Functions を停止します..."
	@if [ -f /tmp/supabase_functions.pid ]; then \
		kill $$(cat /tmp/supabase_functions.pid) 2>/dev/null || true; \
		rm -f /tmp/supabase_functions.pid; \
		echo "Supabase Edge Functions が停止しました。"; \
	else \
		echo "Supabase Edge Functions のPIDファイルが見つからないか、既に停止しています。"; \
	fi

.PHONY: build up down restart status app ps logs lint format test test-coverage deploy-ga-pageviews deploy-sitemap deploy-gemini functions-serve _stop-edge-functions