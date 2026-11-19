/**
 * 演示场景配置（fixture）
 * 所有 SQL 均含 HTML 高亮标签，渲染时通过 dangerouslySetInnerHTML
 * 这些数据在真实产品中应由后端 SSE 推送而来
 */
export type SceneKey =
    | 'running'
    | 'approve-amber'
    | 'danger-red'
    | 'done'
    | 'failed'
    | 'rejected';

export type StepState = 'done' | 'running' | 'paused' | 'todo' | 'error';

export interface StepCard {
    t: string;
    st: StepState;
    stText: string;
    io: [string, string][];
}

export interface StatusInfo {
    cls: 'running' | 'wait' | 'done' | 'rejected' | 'failed';
    text: string;
}

export interface RiskInfo {
    cls: 'amber' | 'red' | 'green';
    text: string;
}

export interface AuditInfo {
    approver: string;
    time: string;
    thread: string;
}

export interface ResultInfo {
    rows: string;
    ms: string;
    note: string;
}

export interface ErrorInfo {
    title: string;
    message: string;
    note: string;
}

export interface SceneConfig {
    status: StatusInfo;
    steps: StepState[];
    chatUser: string;
    chatAgent: string;
    panelMode: 'running' | 'approve' | 'result' | 'failed' | 'rejected';
    summary?: [string, string][];
    risk?: RiskInfo;
    riskNote?: string;
    sql?: string;
    danger?: boolean;
    audit?: AuditInfo;
    result?: ResultInfo;
    error?: ErrorInfo;
    oldSql?: string;
    rejectReason?: string;
    cards: StepCard[];
}

/* ===== SQL 语句（带 HTML 高亮） ===== */
const SQL_ADD_COL = `<span class="kw">ALTER TABLE</span> demo_business.users <span class="kw">ADD COLUMN</span> last_login_at <span class="kw">TIMESTAMP</span>;`;

const SQL_EXPIRE_ORDER = `<span class="cmt">-- 把 pending 超过 7 天的订单标为 expired</span>\n<span class="kw">UPDATE</span> demo_business.orders\n<span class="kw">SET</span> status = <span class="str">'expired'</span>\n<span class="kw">WHERE</span> status = <span class="str">'pending'</span>\n  <span class="kw">AND</span> created_at <span class="kw">&lt;</span> <span class="kw">NOW()</span> - <span class="kw">INTERVAL</span> <span class="str">'7 days'</span>;`;

const SQL_EXPIRE_FIXED = `<span class="cmt">-- 已按驳回意见改用固定时间，不再用 NOW()</span>\n<span class="kw">UPDATE</span> demo_business.orders\n<span class="kw">SET</span> status = <span class="str">'expired'</span>\n<span class="kw">WHERE</span> status = <span class="str">'pending'</span>\n  <span class="kw">AND</span> created_at <span class="kw">&lt;</span> <span class="kw">TIMESTAMP</span> <span class="str">'2026-10-13 00:00:00'</span>;`;

const SQL_DANGER = `<span class="cmt">-- 高危：UPDATE 无 WHERE，全表改写，原 status 丢失</span>\n<span class="kw">UPDATE</span> demo_business.users\n<span class="kw">SET</span> status = <span class="str">'active'</span>;`;

const SQL_FAIL = `<span class="kw">ALTER TABLE</span> demo_business.users <span class="kw">ADD COLUMN</span> email <span class="kw">VARCHAR</span>(128);`;

export const SCENES: Record<SceneKey, SceneConfig> = {
    running: {
        status: { cls: 'running', text: 'Agent 执行中' },
        steps: ['done', 'running', 'todo', 'todo', 'todo'],
        chatUser: '给 users 表加 last_login_at 字段',
        chatAgent: '<span style="color:#9ca3af">正在生成 SQL…</span>',
        panelMode: 'running',
        cards: [
            {
                t: '① 解析需求',
                st: 'done',
                stText: '完成',
                io: [
                    [
                        '输出（结构化描述 JSON）',
                        `{ "intent": "add_column", "table": "users",\n  "column": "last_login_at", "type": "TIMESTAMP" }`,
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
    },

    'approve-amber': {
        status: { cls: 'wait', text: '待人工审批' },
        steps: ['done', 'done', 'done', 'paused', 'todo'],
        chatUser: '给 users 表加 last_login_at 字段',
        chatAgent:
            '已解析需求并完成风险评估（中风险·黄），SQL 已生成，Agent 在审批点暂停，请右侧审阅。',
        summary: [
            ['操作类型', 'DDL 改结构（新增列）'],
            ['目标表', 'demo_business.users'],
            ['影响范围', '新增 last_login_at TIMESTAMP 列；存量 20 行该列为 NULL，不改写已有数据'],
            ['可逆性', '可回滚（DROP COLUMN 删除该列）'],
        ],
        risk: { cls: 'amber', text: '中风险 · 黄' },
        riskNote: '规则命中 ALTER TABLE → 黄；PG 加可空列、无默认值，属 instant DDL，不锁表；可回滚。',
        sql: SQL_ADD_COL,
        panelMode: 'approve',
        danger: false,
        cards: [
            {
                t: '① 解析需求',
                st: 'done',
                stText: '完成',
                io: [
                    ['输入（原始自然语言）', '给 users 表加 last_login_at 字段'],
                    [
                        '输出（结构化描述 JSON）',
                        `{ "intent": "add_column", "table": "users",\n  "column": "last_login_at", "type": "TIMESTAMP" }`,
                    ],
                ],
            },
            {
                t: '② 生成 SQL',
                st: 'done',
                stText: '完成',
                io: [
                    ['输入', '结构化描述；无 rejection_reason'],
                    ['输出（PostgreSQL）', SQL_ADD_COL],
                ],
            },
            {
                t: '③ 风险评估',
                st: 'done',
                stText: '完成',
                io: [
                    [
                        '输出（assess_risk）',
                        `{ "risk_level": "yellow",\n  "rule": "ALTER TABLE",\n  "reversible": true }`,
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
                        'LangGraph interrupt() 暂停，图状态经 PostgresSaver 写入 checkpoint；服务重启不丢。',
                    ],
                    ['接口', 'POST /agent/resume  { thread_id, action: "approve" | "reject", reason? }'],
                ],
            },
            {
                t: '⑤ SQL 执行',
                st: 'todo',
                stText: '未开始',
                io: [['说明', '仅在收到 action=approve 后，在 demo_business schema 执行。']],
            },
        ],
    },

    'danger-red': {
        status: { cls: 'wait', text: '待人工审批 · 高危' },
        steps: ['done', 'done', 'done', 'paused', 'todo'],
        chatUser: '把所有用户的 status 都改成 active',
        chatAgent:
            '规则层判定为高危（红）：UPDATE 无 WHERE 将全表改写。批准按钮已锁定，需人工勾选确认词后才可提交。',
        summary: [
            ['操作类型', 'DML 全表更新（无 WHERE）'],
            ['目标表', 'demo_business.users'],
            ['影响范围', '20 行的 status 字段被覆盖，无过滤条件，原值无法逐条核对'],
            ['可逆性', '不可逆（原 status 值丢失，无备份无法还原）'],
        ],
        risk: { cls: 'red', text: '高风险 · 红' },
        riskNote: '规则命中 UPDATE/DELETE 无 WHERE → 红；不靠 LLM 判断，规则层确定性兜底。',
        sql: SQL_DANGER,
        panelMode: 'approve',
        danger: true,
        cards: [
            {
                t: '① 解析需求',
                st: 'done',
                stText: '完成',
                io: [
                    [
                        '输出（结构化描述）',
                        `{ "intent": "update", "table": "users",\n  "set": { "status": "active" }, "where": null }`,
                    ],
                ],
            },
            { t: '② 生成 SQL', st: 'done', stText: '完成', io: [['输出（PostgreSQL）', SQL_DANGER]] },
            {
                t: '③ 风险评估',
                st: 'done',
                stText: '完成',
                io: [
                    [
                        '输出（assess_risk）',
                        `{ "risk_level": "red",\n  "rule": "UPDATE_WITHOUT_WHERE",\n  "reversible": false, "rows": 20 }`,
                    ],
                ],
            },
            {
                t: '④ 人工审批',
                st: 'paused',
                stText: '高危 · 需二次确认',
                io: [['说明', '红风险默认禁用批准，勾选确认词后方可点击。']],
            },
            {
                t: '⑤ SQL 执行',
                st: 'todo',
                stText: '未开始',
                io: [['说明', '批准后在事务内执行，失败自动回滚，不自动重试。']],
            },
        ],
    },

    done: {
        status: { cls: 'done', text: '执行完成' },
        steps: ['done', 'done', 'done', 'done', 'done'],
        chatUser: '把 orders 里 pending 超 7 天的标 expired',
        chatAgent: '已批准并执行完成，预估 8 行与实际影响一致。',
        sql: SQL_EXPIRE_ORDER,
        panelMode: 'result',
        danger: false,
        audit: { approver: 'admin', time: '2026-10-19 18:02:31', thread: 'th_20261019_001' },
        result: {
            rows: '8 行',
            ms: '120 ms',
            note: '与风险评估预估的 8 条 pending 超 7 天订单一致，无报错，事务已提交。',
        },
        cards: [
            {
                t: '① 解析需求',
                st: 'done',
                stText: '完成',
                io: [
                    [
                        '输出',
                        `{ "intent":"update", "table":"orders",\n  "set":{"status":"expired"},\n  "where":"pending 且 created_at < NOW()-7d" }`,
                    ],
                ],
            },
            { t: '② 生成 SQL', st: 'done', stText: '完成', io: [['输出', SQL_EXPIRE_ORDER]] },
            {
                t: '③ 风险评估',
                st: 'done',
                stText: '完成',
                io: [
                    [
                        '输出',
                        `{ "risk_level":"yellow", "rule":"UPDATE_WITH_WHERE",\n  "estimated_rows": 8, "reversible": true }`,
                    ],
                ],
            },
            {
                t: '④ 人工审批',
                st: 'done',
                stText: '已批准',
                io: [['决策', 'action=approve，审批人 admin，时间 2026-10-19 18:02:31']],
            },
            {
                t: '⑤ SQL 执行',
                st: 'done',
                stText: '完成',
                io: [['输出', `{ "rows_affected": 8, "duration_ms": 120, "error": null }`]],
            },
        ],
    },

    failed: {
        status: { cls: 'failed', text: '执行失败 · 已回滚' },
        steps: ['done', 'done', 'done', 'done', 'error'],
        chatUser: '给 users 表加一个 email 字段',
        chatAgent:
            'SQL 执行报错：email 列已存在。事务已回滚，未产生任何变更。可让 Agent 重新生成或返回修改。',
        sql: SQL_FAIL,
        panelMode: 'failed',
        danger: false,
        audit: { approver: 'admin', time: '2026-10-19 18:10:05', thread: 'th_20261019_002' },
        error: {
            title: '执行失败 · 事务已回滚',
            message: 'column "email" of relation "users" already exists',
            note: '事务内执行，失败自动 ROLLBACK，未留下半执行状态。用户可让 Agent 重新生成或手动修改 SQL 后再次提交审批。',
        },
        cards: [
            {
                t: '① 解析需求',
                st: 'done',
                stText: '完成',
                io: [['输出', `{ "intent":"add_column", "table":"users", "column":"email" }`]],
            },
            { t: '② 生成 SQL', st: 'done', stText: '完成', io: [['输出', SQL_FAIL]] },
            {
                t: '③ 风险评估',
                st: 'done',
                stText: '完成',
                io: [['输出', `{ "risk_level":"yellow", "rule":"ALTER TABLE" }`]],
            },
            {
                t: '④ 人工审批',
                st: 'done',
                stText: '已批准',
                io: [['决策', 'action=approve，审批人 admin，时间 2026-10-19 18:10:05']],
            },
            {
                t: '⑤ SQL 执行',
                st: 'error',
                stText: '失败 · 已回滚',
                io: [
                    [
                        '错误输出',
                        `ERROR:  column "email" of relation "users" already exists\nSQLSTATE: 42701\n事务状态: ROLLBACK 完成`,
                    ],
                ],
            },
        ],
    },

    rejected: {
        status: { cls: 'wait', text: '已驳回 · 重新生成待审' },
        steps: ['done', 'done', 'done', 'paused', 'todo'],
        chatUser: '把 orders 里 pending 超 7 天的标 expired',
        chatAgent:
            '驳回原因已写回 State，Agent 回到 generate_sql 节点重写（固定时间替代 NOW()），再次进入审批。',
        summary: [
            ['操作类型', 'DML 条件更新（带 WHERE）'],
            ['目标表', 'demo_business.orders'],
            ['影响范围', '预计 8 行：pending 且创建于 2026-10-13 之前'],
            ['可逆性', '可回滚（按原状态反向 UPDATE）'],
        ],
        risk: { cls: 'amber', text: '中风险 · 黄' },
        riskNote:
            '驳回意见：「不要用 NOW()，请写固定时间」。新 SQL 已替换为固定时间戳，请再次审阅。',
        sql: SQL_EXPIRE_FIXED,
        panelMode: 'rejected',
        danger: false,
        oldSql: SQL_EXPIRE_ORDER,
        rejectReason: '不要用 NOW()，请写固定时间，避免演示口径随当前时间漂移。',
        cards: [
            {
                t: '① 解析需求',
                st: 'done',
                stText: '完成',
                io: [['输出', `{ "intent":"update", "table":"orders" }`]],
            },
            {
                t: '② 生成 SQL（第 2 次，带驳回原因）',
                st: 'done',
                stText: '完成',
                io: [
                    ['输入（rejection_reason）', '不要用 NOW()，请写固定时间'],
                    ['输出（重写后）', SQL_EXPIRE_FIXED],
                ],
            },
            {
                t: '③ 风险评估',
                st: 'done',
                stText: '完成',
                io: [['输出', `{ "risk_level":"yellow", "estimated_rows": 8 }`]],
            },
            {
                t: '④ 人工审批',
                st: 'paused',
                stText: '等待再次决策',
                io: [
                    [
                        '接口',
                        'POST /agent/resume { action:"reject", reason } → 回 generate_sql；{ action:"approve" } → execute_sql',
                    ],
                ],
            },
            { t: '⑤ SQL 执行', st: 'todo', stText: '未开始', io: [] },
        ],
    },
};

export const riskConfig: Record<string, any> = {
    'yellow': { txt: '中风险 · 黄', cls: 'amber' },
    'green': { txt: '低风险 · 绿', cls: 'green' },
    'red': { txt: '高风险 · 红', cls: 'red' },
}