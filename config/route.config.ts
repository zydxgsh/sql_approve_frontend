export const routes = [
    {
        path: '/',
        redirect: '/agentControl',
    },
    {
        name: 'sql审批台',
        path: '/agentControl',
        component: './agentControl',
    },
    {
        name: '接口测试',
        path: '/test',
        component: './test',
    }
    // {
    //     name: '首页',
    //     path: '/home',
    //     component: './Home',
    // },
    // {
    //     name: '权限演示',
    //     path: '/access',
    //     component: './Access',
    // },
    // {
    //     name: ' CRUD 示例',
    //     path: '/table',
    //     component: './Table',
    // },
    // {
    //     name: '接口测试',
    //     path: '/test',
    //     component: './test',
    // }
]