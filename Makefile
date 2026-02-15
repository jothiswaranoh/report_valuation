.PHONY: dev-containers dev-down prod-containers

dev-containers:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

dev-down:
	docker compose down

prod-containers:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
