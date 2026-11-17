import { defineConfig } from '@umijs/max';
import { routes } from './config/route.config';

export default defineConfig({
    // 路径别名，ts也能识别
    alias: {
        '@': './src',
    },
    access: {},
    initialState: {},
    // layout: {
    //     title: 'sql审批系统',
    // },
    //   约定式路由
    // routes: [
    //     {
    //         path: '/',
    //         component: '@/layouts/index', // 全局布局
    //         routes: [
    //             { path: '/', redirect: '/welcome' },
    //             { path: '/welcome', component: '@/pages/welcome' },
    //         ],
    //     },
    // ],
    routes: routes,
    // 代理（跨域）
    proxy: {
        '/api': {
            target: 'http://127.0.0.1:8000', // 后端地址
            changeOrigin: true,
            pathRewrite: { '^/api': '' }, // 如果后端不带 /api 前缀就开启
            // 核心：开启自己接管响应流，不让代理缓存body
            selfHandleResponse: true,
            onProxyReq(proxyReq) {
                // 不要缓存请求体
                proxyReq.setHeader('cache-control', 'no-cache');
            },
            onProxyRes(proxyRes, req, res) {
                // 给代理返回头标记关闭缓冲
                proxyRes.headers['x-accel-buffering'] = 'no';
                // 把上游的流原样透传给浏览器，不做任何组装
                proxyRes.pipe(res);
            },
            // 超时设为0，避免长连接超时切断
            proxyTimeout: 0,
            timeout: 0
        },
    },
    //MFSU 开发加速（max默认开启，大项目很香）
    mfsu: {
        strategy: 'normal',
    },

    //  打包输出
    outputPath: 'dist',
    // 部署到子目录才需要改 publicPath，如 /admin/
    publicPath: '/',
    //  打包优化
    chainWebpack(memo) {
        // 分包配置
        memo.optimization.splitChunks({
            chunks: 'all',
            cacheGroups: {
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    priority: 10,
                },
                antd: {
                    test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/,
                    priority: 20,
                },
            },
        });
        return memo;
    },

    // 打包清除 console（生产环境）
    extraBabelPlugins: [
        ['transform-remove-console', { exclude: ['error', 'warn'] }],
    ],

    // antd 配置
    antd: {
        // 主题修改
        theme: {
            // '@primary-color': '#1890ff',
        },
    },

    //  Max 内置插件
    model: {}, // 开启umi-model状态管理
    request: {
        dataField: 'data', // 后端返回格式：{code, data, message}
    },
    dva: {},// 开启dva

    //  其他
    hash: true, // 打包文件名带hash，解决缓存问题
    // title: 'sql审批系统', // 页面默认title
    npmClient: 'npm',
    utoopack: {},
    // 基础配置：开启 javascriptEnabled（Ant Design 主题定制/内联 JS 表达式依赖）
    lessLoader: {
        javascriptEnabled: true,
        // 可选：全局注入变量文件（这样组件里就不需要手动 @import 了）
        modifyVars: {
            hack: `true; @import "~@/styles/variables.less";`,
        },
    },
});

