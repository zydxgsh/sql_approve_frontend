import { riskConfig } from "./config/scenes";
const approveTxt: Record<string, string> = {
    'approve': '同意执行',
    'reject': '驳回'
}
// 解析需求成固定结构" {'node': 'parse_node', 'output': {'parsed_input': {'intent': 'add_column', 'table': 'demo_business.users', 'detail': '添加字段 last_login_at'}}}"
const pareseNode = (nodeValues: Record<string, any>, scene: Record<string, any>) => {
    const { chatUser, cards = [], sql } = scene;
    const { node, output: { parsed_input } = {} } = nodeValues || {};
    if (!parsed_input?.intent)
        return {
            node: 'parse_node',
            status: { cls: 'todo', text: 'Agent 执行失败' },
            steps: ['done', 'todo', 'todo', 'todo', 'todo'],
            chatUser: chatUser,
            chatAgent: '<span style="color:#9ca3af">执行失败</span>',
            summary: [],
            risk: '',
            riskNote: '',
            panelMode: 'running',
            sql: '',
            danger: false,
            cards: [
                {
                    t: '① 解析需求',
                    st: 'done',
                    stText: '无法识别需求',
                    io: [
                        [
                            '输出（结构化描述 JSON）',
                            JSON.stringify(parsed_input),
                        ],
                    ],
                },
                { t: '② 生成 SQL', st: 'todo', stText: '未开始', io: [], },
                { t: '③ 风险评估', st: 'todo', stText: '未开始', io: [] },
                { t: '④ 人工审批', st: 'todo', stText: '未开始', io: [] },
                { t: '⑤ SQL 执行', st: 'todo', stText: '未开始', io: [] },
            ],
        }
    return {
        node: 'parse_node',
        status: { cls: 'running', text: 'Agent 执行中' },
        steps: ['done', 'running', 'todo', 'todo', 'todo'],
        chatUser: chatUser,
        chatAgent: '<span style="color:#9ca3af">正在生成 SQL…</span>',
        summary: [],
        risk: '',
        riskNote: '',
        panelMode: 'running',
        sql: '',
        danger: false,
        cards: [
            {
                t: '① 解析需求',
                st: 'done',
                stText: '完成',
                io: [
                    [
                        '输出（结构化描述 JSON）',
                        JSON.stringify(parsed_input),
                    ],
                ],
            },
            {
                t: '② 生成 SQL',
                st: 'running',
                stText: '执行中…',
                io: [['说明', 'LLM 正在生成 PostgreSQL 语句，SSE 逐节点推送进度。']],
            },
            { t: '③ 风险评估', st: 'todo', stText: '未开始', io: [] },
            { t: '④ 人工审批', st: 'todo', stText: '未开始', io: [] },
            { t: '⑤ SQL 执行', st: 'todo', stText: '未开始', io: [] },
        ],
    }
}
// 生成sql语句
const generateNode = (nodeValues: Record<string, any>, scene: Record<string, any>) => {
    const { chatUser, cards = [], sql } = scene;
    const { output: { generated_sql = '' } = {} } = nodeValues || {};
    return {
        node: 'generate_node',
        status: { cls: 'running', text: '风险评估中...' },
        steps: ['done', 'done', 'running', 'todo', 'todo'],
        chatUser: chatUser,
        chatAgent: '正在进行sql语句风险评估...',
        summary: [],
        risk: '',
        riskNote: '',
        panelMode: 'running',
        sql: generated_sql,
        danger: false,
        cards: [
            cards[0],
            {
                t: '② 生成 SQL',
                st: 'done',
                stText: '完成',
                io: [
                    ['输入', '结构化描述'],
                    ['输出（PostgreSQL）', generated_sql],
                ],
            },
            {
                t: '③ 风险评估',
                st: 'running',
                stText: '评估中',
                io: [
                    ['输入', generated_sql],
                    ['输出', '根据sql语句操作类型判定风险级别'],
                ],
            },
            { t: '④ 人工审批', st: 'todo', stText: '未开始', io: [] },
            { t: '⑤ SQL 执行', st: 'todo', stText: '未开始', io: [] },
        ],
    }
}
// 评估风险级别
const evaluteNode = (nodeValue: Record<string, any>, scene: Record<string, any>) => {
    const { chatUser, cards = [], sql } = scene;
    const { output: { risk_level = '', risk_reason = '' } = {} } = nodeValue || {};
    if (risk_level === 'green') {
        return {
            node: 'evalute_node',
            status: { cls: 'running', text: '等待执行...' },
            steps: ['done', 'done', 'done', 'done', 'running'],
            chatUser: chatUser,
            chatAgent: `${risk_reason}，已批准并准备执行`,
            sql: sql,
            panelMode: 'running',
            danger: false,
            risk: { cls: riskConfig.green.cls || '', text: '低风险 · 绿' },
            riskNote: risk_reason,
            // audit: { approver: 'admin', time: '2026-10-19 18:02:31', thread: 'th_20261019_001' },
            // result: {
            //     rows: '8 行',
            //     ms: '120 ms',
            //     note: '与风险评估预估的 8 条 pending 超 7 天订单一致，无报错，事务已提交。',
            // },
            summary: [],
            cards: [
                cards[0],
                cards[1],
                { t: '③ 风险评估', st: 'done', stText: '完成', io: [['输出', `{ "risk_level":${risk_level}, "rule":${risk_reason}`,],], },
                { t: '④ 人工审批', st: 'done', stText: '完成', io: [['输出', `${risk_reason}，无需审批，可直接执行`,]] },
                { t: '⑤ SQL 执行', st: 'running', stText: '执行中', io: [['输入', sql]] },
            ],
        }
    }
    return {
        node: 'evalute_node',
        status: { cls: 'wait', text: '待人工审批' },
        steps: ['done', 'done', 'done', 'paused', 'todo'],
        chatUser: chatUser,
        chatAgent:
            '已解析需求并完成风险评估，SQL 已生成，Agent 在审批点暂停，请右侧审阅。',
        summary: [
            ['操作类型', 'DDL 改结构（新增列）'],
            ['目标表', 'demo_business.users'],
            ['影响范围', '新增 last_login_at TIMESTAMP 列；存量 20 行该列为 NULL，不改写已有数据'],
            ['可逆性', '可回滚（DROP COLUMN 删除该列）'],
        ],
        risk: { cls: riskConfig?.[risk_level]?.cls, text: riskConfig?.[risk_level]?.txt },
        riskNote: risk_reason,
        sql: sql,
        panelMode: 'approve',
        danger: false,
        cards: [
            cards[0],
            cards[1],
            {
                t: '③ 风险评估',
                st: 'done',
                stText: '完成',
                io: [
                    [
                        '输出（assess_risk）',
                        `{ "risk_level": ${risk_level},\n  "rule": ${risk_reason} }`,
                    ],
                ],
            },
            {
                t: '④ 人工审批',
                st: 'paused',
                stText: '等待中 · interrupt()',
                io: [
                    [
                        '说明',
                        '等待人工审批',
                    ],
                ],
            },
            {
                t: '⑤ SQL 执行',
                st: 'todo',
                stText: '未开始',
                io: [['说明', '仅在收到 action=approve 后，在 demo_business schema 执行。']],
            },
        ],
    }
}
// 审批执行
const approveNode = (nodeValue: Record<string, any>, scene: Record<string, any>) => {
    const { chatUser, cards = [], sql, risk, riskNote, } = scene;
    const { output: { approval_decision = '', reject_reason = '', input_txt } = {} } = nodeValue || {};
    const approval_result: Record<string, string> = {
        'reject': '拒绝执行，重新修改sql语句',
        'approve': '同意执行',
        'requireModify': '拒绝执行，重新修改需求输出'
    }
    return {
        node: 'approval_node',
        status: { cls: risk === 'green' ? 'done' : 'running', text: risk === 'green' ? '无需审批' : '审批中' },
        steps: ['done', 'done', 'done', 'done', approval_decision === 'approve' ? 'running' : 'todo'],
        chatUser: chatUser,
        chatAgent:
            `审批已执行，${approval_result[approval_decision]}`,
        summary: [
            ['操作类型', 'DDL 改结构（新增列）'],
            ['目标表', 'demo_business.users'],
            ['影响范围', '新增 last_login_at TIMESTAMP 列；存量 20 行该列为 NULL，不改写已有数据'],
            ['可逆性', '可回滚（DROP COLUMN 删除该列）'],
        ],
        risk,
        riskNote,
        sql: sql,
        panelMode: approval_decision === 'approve' ? 'approve' : 'reject',
        danger: false,
        rejectReason: `${reject_reason}${approval_decision === 'requireModify' ? `,修改需求为${input_txt}` : ''}`,
        cards: [
            cards[0],
            cards[1],
            cards[2],
            {
                t: '④ 人工审批',
                st: risk === 'green' ? 'done' : 'running',
                stText: risk === 'green' ? '审批完成' : '审批中',
                io: [
                    [
                        '说明',
                        risk === 'green' ? '无需审批' : `${approveTxt?.[approval_decision] || ''} ${reject_reason}`,
                    ],
                ],
            },
            {
                t: '⑤ SQL 执行',
                st: risk === 'green' ? 'running' : 'todo',
                stText: risk === 'green' ? '执行中...' : '未开始',
                io: [['输入', sql]],
            },
        ],
    }
}
// 执行sql
const executeNode = (nodeValue: Record<string, any>, scene: Record<string, any>) => {
    const { chatUser, cards = [], sql, risk, riskNote, } = scene;
    const { output: { final_result = {} } = {} } = nodeValue || {};
    const { error, row_effects, code } = final_result || {};
    return {
        node: 'execute_node',
        status: { cls: code === 1 ? 'done' : 'failed', text: code === 1 ? '执行成功' : '执行失败' },
        steps: ['done', 'done', 'done', 'done', code === 1 ? 'done' : 'error'],
        chatUser: chatUser,
        chatAgent:
            `执行结果反馈：${code === 1 ? '执行成功' : '执行失败'}`,
        summary: [
            ['操作类型', 'DDL 改结构（新增列）'],
            ['目标表', 'demo_business.users'],
            ['影响范围', '新增 last_login_at TIMESTAMP 列；存量 20 行该列为 NULL，不改写已有数据'],
            ['可逆性', '可回滚（DROP COLUMN 删除该列）'],
        ],
        risk,
        riskNote,
        sql: sql,
        panelMode: code === 1 ? 'result' : 'failed',
        danger: false,
        cards: [
            cards[0],
            cards[1],
            cards[2],
            {
                t: '④ 人工审批',
                st: 'done',
                stText: '审批完成',
                io: [
                    [
                        '说明',
                        risk === 'green' ? '无需审批' : '同意执行',
                    ],
                ],
            },
            {
                t: '⑤ SQL 执行',
                st: 'done',
                stText: '',
                io: [['输入', sql], ['输出', JSON.stringify(final_result)]],
            },
        ],
    }
}
const handleNodes = (params: any, scene: Record<string, any>, req: string) => {
    const { event, data: { thread_id = '', node = '' } = {}, data = {} } = params;
    if (event === 'started') {
        localStorage.setItem('thread_id', thread_id || '');
        return {
            'threadId': thread_id,
            'chatUser': req,
            'node': '',
        }
    } else if (event === 'node_update') {
        switch (node) {
            case 'parse_node': return pareseNode(data, scene);
            case 'generate_node': return generateNode(data, scene);
            case 'evalute_node': return evaluteNode(data, scene);
            case 'approval_node': return approveNode(data, scene);
            case 'execute_node': return executeNode(data, scene);
            default: return null;
        }
    } else if (event === 'interrupt') {
        return evaluteNode({ output: { ...data.payload || {} } }, scene);
    }
    return null;
}

// 反推历史状态
const historyState = {
    'parse_node': ['parse_node'],
    'generate_node': ['parse_node', 'generate_node'],
    'evalute_node': ['parse_node', 'generate_node', 'evalute_node'],
    'approval_node': ['parse_node', 'generate_node', 'evalute_node', 'approval_node'],
    'execute_node': ['parse_node', 'generate_node', 'evalute_node', 'approval_node', 'execute_node'],
}

// 根据节点反推历史状态数据
const getHistoryState = (values: Record<string, any>) => {
    const { next, values: { generated_sql = '', input_txt = '', parsed_input = {}, reject_reason = '',
        risk_level = '', risk_reason = '', approval_decision = '', final_result = {} } = {} } = values || {};
    if (!next) return;
    const nextNode = next[0];
    let cards: Array<any> = [];
    if (nextNode === 'evalute_node') {
        cards = [
            {
                t: '① 解析需求',
                st: 'done',
                stText: '完成',
                io: [
                    [
                        '输出（结构化描述 JSON）',
                        JSON.stringify(parsed_input),
                    ],
                ],
            }
        ]
    } else if (nextNode === 'approval_node') {
        cards = [
            {
                t: '① 解析需求',
                st: 'done',
                stText: '完成',
                io: [
                    [
                        '输出（结构化描述 JSON）',
                        JSON.stringify(parsed_input),
                    ],
                ],
            },
            {
                t: '② 生成 SQL',
                st: 'done',
                stText: '完成',
                io: [
                    ['输入', '结构化描述'],
                    ['输出（PostgreSQL）', generated_sql],
                ],
            },
        ]
    } else if (nextNode === 'execute_node') {
        cards = [
            {
                t: '① 解析需求',
                st: 'done',
                stText: '完成',
                io: [
                    [
                        '输出（结构化描述 JSON）',
                        JSON.stringify(parsed_input),
                    ],
                ],
            },
            {
                t: '② 生成 SQL',
                st: 'done',
                stText: '完成',
                io: [
                    ['输入', '结构化描述'],
                    ['输出（PostgreSQL）', generated_sql],
                ],
            },
            {
                t: '③ 风险评估',
                st: 'done',
                stText: '完成',
                io: [
                    [
                        '输出（assess_risk）',
                        `{ "risk_level": ${risk_level},\n  "rule": ${risk_reason} }`,
                    ],
                ],
            },
        ]
    }
    // 流程结束
    if (next.length === 0) {
        cards = [
            {
                t: '① 解析需求',
                st: 'done',
                stText: '完成',
                io: [
                    [
                        '输出（结构化描述 JSON）',
                        JSON.stringify(parsed_input),
                    ],
                ],
            },
            {
                t: '② 生成 SQL',
                st: 'done',
                stText: '完成',
                io: [
                    ['输入', '结构化描述'],
                    ['输出（PostgreSQL）', generated_sql],
                ],
            },
            {
                t: '③ 风险评估',
                st: 'done',
                stText: '完成',
                io: [
                    [
                        '输出（assess_risk）',
                        `{ "risk_level": ${risk_level},\n  "rule": ${risk_reason} }`,
                    ],
                ],
            },
            {
                t: '④ 人工审批',
                st: 'done',
                stText: '已审批',
                io: [
                    [
                        '说明',
                        risk_level === 'green' ? '无需审批' : `${approveTxt?.[approval_decision] || ''} ${reject_reason}`,
                    ],
                ],
            },
            {
                t: '⑤ SQL 执行',
                st: 'done',
                stText: '',
                io: [['输入', generated_sql], ['输出', JSON.stringify(final_result)]],
            },
        ]
        return executeNode({ output: { final_result } }, { chatUser: input_txt, cards: cards, sql: generated_sql, risk: risk_level, riskNote: risk_reason },)
    }
    switch (nextNode) {
        case 'parse_node': return pareseNode({ output: { parsed_input } }, { chatUser: input_txt },);
        case 'generate_node': return pareseNode({ output: { parsed_input } }, { chatUser: input_txt },);
        case 'evalute_node': return generateNode({ output: { generated_sql } }, { chatUser: input_txt, cards: cards },);
        case 'approval_node': return evaluteNode({ output: { risk_level, risk_reason } }, { chatUser: input_txt, cards: cards, sql: generated_sql },);
        case 'execute_node': return approveNode({ output: { approval_decision, reject_reason, input_txt } }, { chatUser: input_txt, cards: cards, sql: generated_sql, risk: risk_level, riskNote: risk_reason },);
        default: return null;
    }
}


export { getHistoryState, handleNodes, historyState };

