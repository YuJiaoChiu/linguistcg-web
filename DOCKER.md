# Docker 部署指南

## 快速启动（开发/测试）

```bash
# 克隆项目
git clone https://github.com/YuJiaoChiu/linguistcg-web.git
cd linguistcg-web

# 启动服务
docker-compose up -d --build

# 访问
# 前端: http://localhost:3000
# 后端: http://localhost:8000
# API 文档: http://localhost:8000/docs
```

## 生产部署（带 Nginx）

```bash
# 使用生产配置（单端口 80 访问）
docker-compose -f docker-compose.prod.yml up -d --build

# 访问
# http://localhost
```

## NAS 部署注意事项

1. **修改 ALLOWED_ORIGINS**：编辑 `docker-compose.yml`，将 `ALLOWED_ORIGINS` 改为你的 NAS IP 或域名
   ```yaml
   - ALLOWED_ORIGINS=http://192.168.1.100:3000,http://your-nas.local:3000
   ```

2. **修改 API 地址**：编辑 `docker-compose.yml`，将前端的 `NEXT_PUBLIC_API_URL` 改为实际后端地址
   ```yaml
   args:
     - NEXT_PUBLIC_API_URL=http://192.168.1.100:8000/api
   ```

3. **数据持久化**：字典和上传的文件会保存在：
   - `./dictionaries/` - 字典文件
   - `./data/uploads/` - 上传的文件
   - `./data/backups/` - 备份文件

## 常用命令

```bash
# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新代码后重新构建
git pull
docker-compose up -d --build
```
