import { Effect, Reducer } from 'redux-saga/effects';
import { SceneConfig, SceneKey } from './scenes';

/** 当前右侧面板展示模式 */
export type PanelMode = SceneConfig['panelMode'];

/** Model State 类型 */
export interface AgentState {
    /** 当前激活的场景 key（原型演示用） */
    sceneKey: SceneKey;
    /** 当前场景完整配置 */
    scene: SceneConfig;
    /** 需求输入框内容 */
    requirement: string;
    /** 聊天区用户消息 */
    chatUserMsg: string;
    /** 当前 thread_id */
    threadId: string | null;
    /** 提交中 loading */
    submitting: boolean;
}

interface AgentModel {
    namespace: 'agent';
    state: AgentState;
    effects: {
        /** 切换演示场景 */
        switchScene: Effect;
        /** 启动 Agent 任务 */
        startAgent: Effect;
        /** 批准变更 */
        approve: Effect;
        /** 驳回并填写原因 */
        reject: Effect;
        /** 重置演示数据 */
        resetDemo: Effect;
    };
    reducers: {
        /** 通用状态更新 */
        updateState: Reducer<AgentState>;
    };
}