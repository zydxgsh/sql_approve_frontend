# 阶段1：构建阶段，用node打包umi
FROM node:20-alpine AS builder
WORKDIR /app
# 复制依赖文件
COPY package.json package-lock.json ./
RUN npm ci
# 复制全部源码
COPY . .
# 打包umi
RUN npm run build

# 阶段2：Nginx运行阶段，多阶段构建，只保留dist和nginx，镜像很小
FROM nginx:alpine
# 把打包好的dist复制到nginx静态目录
COPY --from=builder /app/dist /usr/share/nginx/html
# 复制我们自己写的nginx配置
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
# nginx默认监听80端口
EXPOSE 80
# 前台运行nginx（容器必须前台运行，不然直接退出）
CMD ["nginx", "-g", "daemon off;"]
