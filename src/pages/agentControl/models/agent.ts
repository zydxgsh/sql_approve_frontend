import { SagaAction, SagaEffects } from '@/types/saga';
import { serveGet, servePost } from "@/utils/request";
import readSSE from '@/utils/useSSE';
import { message } from 'antd';
import { cancelled } from 'redux-saga/effects';
import { AgentState } from '../config/dataType';
import { SCENES, SceneKey } from '../config/scenes';
// import * as agentService from '../services/agent';

/** 从场景配置构造初始 state */
const buildState = (sceneKey: SceneKey, extra?: Partial<AgentState>): Partial<AgentState> => {
    const sc = SCENES[sceneKey];
    return {
        sceneKey,
        scene: sc,
        chatUserMsg: sc.chatUser,
        ...extra,
    };
}

const consumeSSE = async (response: Response, callback?: (evt: any) => void, signal?: AbortSignal) => {
    // console.log('进入切片解析', response);
    for await (const evt of readSSE(response)) {
        // console.log("开始进入图流程", response)
        if (callback) callback(evt)
    }
}

export default {
    namespace: 'agent',
    state: {
        // sceneKey: 'approve-amber',
        // scene: SCENES['approve-amber'],
        // requirement: '',
        // chatUserMsg: SCENES['approve-amber'].chatUser,
        // threadId: null,
        // submitting: false,
        sceneKey: '',
        scene: {},
        requirement: '',
        chatUserMsg: '',
        threadId: null,
        submitting: false,
    },

    effects: {
        /**
         * 切换演示场景（原型评审用）
         * payload: { sceneKey }
         */
        *switchScene({ payload }: SagaAction, { put }: SagaEffects) {
            const { sceneKey } = payload as { sceneKey: SceneKey };
            yield put({ type: 'updateState', payload: buildState(sceneKey, { requirement: '' }) });
        },

        /**
         * 提交新需求 → 启动 Agent
         * payload: { requirement }
         * 流程：切到 running 场景 → 调用接口 → 模拟 1.4s 后进入审批场景
         */
        *startAgent({ payload, callback }: SagaAction, { put, call }: SagaEffects) {
            const { requirement } = payload as { requirement: string };
            const controller = new AbortController()
            try {
                const response: Response = yield call(servePost, {
                    url: '/api/agent/start',
                    body: {
                        requirement,
                    },
                    isSSE: true,
                })
                // 重点！！加上yield call，saga 会暂停这个 generator，直到 consumeSSE resolve / reject，不然就会立刻往下执行，不会等 SSE 流读完！
                yield call(consumeSSE, response, callback, controller.signal)
            } finally {
                if (yield cancelled()) {
                    // 👉 只有【被 cancel 取消】才进这里：关闭SSE、abort、清理
                    controller.abort()
                }
            }

        },

        /**
         * 批准执行
         * payload: { threadId }
         * 成功后切换到 done 场景
         */
        *approve({ payload, callback }: SagaAction, { put, call, select }: SagaEffects) {
            const { threadId, requireType, reason, newRequirement, id } = payload || {};
            const controller = new AbortController()
            // try {
            //     yield call(agentService.resumeAgent, { thread_id: threadId, action: 'approve' });
            //     message.success('已批准，SQL 执行完成');
            //     yield put({ type: 'updateState', payload: buildState('done') });
            // } catch (e: any) {
            //     message.error(e?.message || '批准失败');
            //     // 真实场景：根据错误切换到 failed 场景
            //     yield put({ type: 'updateState', payload: buildState('failed') });
            // }

            // ================================
            try {
                const response: API.BaseRes = yield call(servePost, {
                    url: '/api/agent/resume',
                    body: {
                        id,
                        requireType,
                        reason,
                        newRequirement
                    },
                    isSSE: true,
                })
                yield call(consumeSSE, response, callback, controller.signal)
            } finally {
                if (yield cancelled()) {
                    // 👉 只有【被 cancel 取消】才进这里：关闭SSE、abort、清理
                    controller.abort()
                }
            }
        },

        *query({ payload, callback }: SagaAction, { put, call, select }: SagaEffects) {
            const { id } = payload || {}
            const response: API.BaseRes = yield call(serveGet, {
                url: `/api/agent/state/${id}`
            })
            console.log('查询图状态', response)
            if (callback) callback(response);
        },

        /**
         * 驳回并填写原因 → 重新生成
         * payload: { threadId, reason }
         * 成功后切换到 rejected 场景（等待再次审批）
         */
        *reject({ payload }: SagaAction, { put, call }: SagaEffects) {
            const { threadId, reason } = payload as { threadId: string; reason: string };
            if (!reason?.trim()) {
                message.warning('请填写驳回原因');
                return;
            }
            // try {
            //     yield call(agentService.resumeAgent, {
            //         thread_id: threadId,
            //         action: 'reject',
            //         reason,
            //     });
            //     message.info('已驳回，Agent 正在重新生成');
            //     yield put({ type: 'updateState', payload: buildState('rejected') });
            // } catch (e: any) {
            //     message.error(e?.message || '驳回失败');
            // }
        },
        *retry({ payload, callback }: SagaAction, { put, call }: SagaEffects) {
            const controller = new AbortController()
            try {
                const response: API.BaseRes = yield call(servePost, {
                    url: '/api/agent/retry',
                    body: payload,
                    isSSE: true,
                })
                yield call(consumeSSE, response, callback, controller.signal)
            } finally {
                if (yield cancelled()) {
                    // 👉 只有【被 cancel 取消】才进这里：关闭SSE、abort、清理
                    controller.abort()
                }
            }
        },

        /**
         * 重置演示数据
         */
        *resetDemo({ payload }: SagaAction, { put, call }: SagaEffects) {
            // try {
            //     yield call(agentService.resetDemo);
            //     message.success('演示数据已重置');
            //     yield put({ type: 'updateState', payload: buildState('approve-amber') });
            // } catch (e: any) {
            //     message.error(e?.message || '重置失败');
            // }
        },
    },

    reducers: {
        /** 通用状态更新 */
        updateState(state: any, { payload }: any) {
            return { ...state, ...payload };
        },
    },
};

// export default model;