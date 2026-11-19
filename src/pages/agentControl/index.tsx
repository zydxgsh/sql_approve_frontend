import { Button, Input, Layout, message, Spin, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'umi';
import ApprovalPanel from './components/ApprovalPanel';
import ChatBubble from './components/ChatBubble';
import FailedPanel from './components/FailedPanel';
import PipelineStepper from './components/PipelineStepper';
import RejectedPanel from './components/RejectedPanel';
import ResultPanel from './components/ResultPanel';
import RunningPanel from './components/RunningPanel';
import StepDetailCards from './components/StepDetailCards';
import { SceneKey } from './config/scenes';
import styles from './index.less';
import { getHistoryState, handleNodes } from './utils';

const { Header, Content, Footer, Sider } = Layout;
const { Text } = Typography;

const DEMO_BUTTONS: { key: SceneKey; label: string }[] = [
  { key: 'running', label: 'Agent 执行中' },
  { key: 'approve-amber', label: '待审批·中风险' },
  { key: 'danger-red', label: '高危·待确认' },
  { key: 'done', label: '执行完成' },
  { key: 'failed', label: '执行失败' },
  { key: 'rejected', label: '驳回·重新生成' },
];

const AgentControl = () => {
  const agent: any = useSelector((state: any) => state.agent);
  //   const loading = useSelector(
  //     (state: any) => state.loading.effects['agent/query'],
  //   );
  const { sceneKey, scene, requirement, chatUserMsg, threadId } = agent;
  const dispatch = useDispatch();
  const sceneRef = useRef({});
  const [isLoading, setIsLoading] = useState(false);

  console.log('=======更新状态=========', scene, sceneKey);

  //   初始化流程状态
  useEffect(() => {
    const id = localStorage.getItem('thread_id');
    if (!id) return;
    setIsLoading(true);
    dispatch({
      type: 'agent/query',
      payload: {
        id,
      },
      callback: (res: any) => {
        setIsLoading(false);
        console.log('初始状态', res);
        const results = getHistoryState(res);
        if (results)
          dispatch({
            type: 'agent/updateState',
            payload: {
              scene: results,
              sceneKey: results?.node || '',
              chatUserMsg: results?.chatUser || requirement,
            },
          });
      },
    });
  }, []);

  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  /** 提交需求 → 启动 Agent */
  const handleSubmit = () => {
    if (!requirement.trim()) {
      message.warning('请先输入或点选一条示例需求');
      return;
    }
    if (sceneKey !== '' && sceneKey !== 'execute_node') {
      message.warning('请等待右侧流程执行完成后再提交~');
      return;
    }
    dispatch({
      type: 'agent/startAgent',
      payload: {
        requirement,
      },
      callback: (res: any) => {
        console.log('流式接收到的内容', res);
        const handleResult = handleNodes(res, sceneRef.current, requirement);
        if (handleResult)
          dispatch({
            type: 'agent/updateState',
            payload: {
              scene: handleResult,
              sceneKey: handleResult?.node || '',
              chatUserMsg: handleResult?.chatUser || requirement,
            },
          });
      },
    });
  };

  /** 批准 */
  const handleApprove = (tid: string) => {
    dispatch({
      type: 'agent/approve',
      payload: {
        id: tid,
        requireType: 'approve',
        reason: '',
      },
      callback: (res: any) => {
        console.log('批准执行后', res);
        const handleResult = handleNodes(res, sceneRef.current, requirement);
        if (handleResult)
          dispatch({
            type: 'agent/updateState',
            payload: {
              scene: handleResult,
              sceneKey: handleResult?.node || '',
              chatUserMsg: handleResult?.chatUser || requirement,
            },
          });
      },
    });
    //   dispatch({ type: 'agent/approve', payload: { threadId: tid } })
  };

  /** 驳回 */
  const handleReject = (tid: string, reason: string, type: string) => {
    let params: Record<string, string> = { id: tid };
    if (type === 'requirement') {
      params = {
        ...params,
        newRequirement: reason,
        requireType: 'requireModify',
      };
    } else {
      params = {
        ...params,
        reason: reason,
        requireType: 'reject',
      };
    }
    dispatch({
      type: 'agent/approve',
      payload: params,
      callback: (res: any) => {
        console.log('驳回执行后', res);
        const handleResult = handleNodes(res, sceneRef.current, requirement);
        if (handleResult)
          dispatch({
            type: 'agent/updateState',
            payload: {
              scene: handleResult,
              sceneKey: handleResult?.node || '',
              chatUserMsg: handleResult?.chatUser || requirement,
            },
          });
      },
    });
    //   dispatch({ type: 'agent/reject', payload: { threadId: tid, reason } })
  };

  //   执行失败重试
  const regenerateEvent = (type: string) => {
    const id = localStorage.getItem('thread_id');
    dispatch({
      type: 'agent/retry',
      payload: {
        id,
        retryType: type,
      },
      callback: (res: any) => {
        console.log('重试结果', res);
        const handleResult = handleNodes(res, sceneRef.current, requirement);
        if (handleResult)
          dispatch({
            type: 'agent/updateState',
            payload: {
              scene: handleResult,
              sceneKey: handleResult?.node || '',
              chatUserMsg: handleResult?.chatUser || requirement,
            },
          });
      },
    });
  };

  /** 重置 */
  //   const handleReset = () => {
  //     //  dispatch({ type: 'agent/resetDemo' })
  //   };

  /** 渲染右侧面板(根据当前执行流程状态来展示) */
  const renderRightPanel = () => {
    switch (scene.panelMode) {
      case 'running':
        return <RunningPanel />;
      case 'result':
        return <ResultPanel scene={scene} />;
      case 'failed':
        return <FailedPanel scene={scene} onRegenerate={regenerateEvent} />;
      case 'rejected':
        return (
          <RejectedPanel
            scene={scene}
            threadId={threadId}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        );
      case 'approve':
        return (
          <ApprovalPanel
            scene={scene}
            threadId={threadId}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Spin spinning={isLoading}>
      <Layout className={styles.appLayout}>
        {/* 三栏 */}
        <Layout className={styles.body}>
          {/* 左栏 */}
          <Sider width={320} theme="light" className={styles.colLeft}>
            <div className={styles.colHead}>
              <h2>需求输入</h2>
              {/* <Tag className={styles.apiTag}>POST /agent/start</Tag> */}
            </div>
            <div className={styles.leftBody}>
              <div>
                <div className={styles.exLabel}>预置示例需求（点击填入）</div>
                <div className={styles.chips}>
                  <button
                    className={styles.chip}
                    onClick={() => {
                      dispatch({
                        type: 'agent/updateState',
                        payload: {
                          requirement: '给 users 表加 last_login_at 字段',
                        },
                      });
                    }}
                  >
                    给 users 表加 last_login_at 字段
                    {/* <Tag color="orange" className={styles.riskMini}>
                    中风险
                  </Tag> */}
                  </button>
                  <button
                    className={styles.chip}
                    onClick={() => {
                      dispatch({
                        type: 'agent/updateState',
                        payload: {
                          requirement:
                            '把 orders 里 pending 超过 7 天的订单标为 expired',
                        },
                      });
                    }}
                  >
                    把 orders 里 pending 超 7 天的标 expired
                    {/* <Tag color="orange" className={styles.riskMini}>
                    中风险
                  </Tag> */}
                  </button>
                  <button
                    className={styles.chip}
                    onClick={() => {
                      dispatch({
                        type: 'agent/updateState',
                        payload: {
                          requirement:
                            '查最近 30 天消费前 5 的用户，给他们加 10% 积分',
                        },
                      });
                    }}
                  >
                    查最近 30 天消费前 5 用户，加 10% 积分
                    {/* <Tag color="red" className={styles.riskMini}>
                    多步·高风险
                  </Tag> */}
                  </button>
                </div>
              </div>
              <div>
                <Input.TextArea
                  rows={4}
                  className={styles.req}
                  value={requirement}
                  onChange={(e) => {
                    dispatch({
                      type: 'agent/updateState',
                      payload: { requirement: e.target.value },
                    });
                  }}
                  placeholder="用自然语言描述对 users / orders / articles 的变更需求…"
                />
                <div className={styles.submitRow}>
                  <Button type="primary" onClick={handleSubmit}>
                    提交任务
                  </Button>
                  {/* <Tag className={styles.apiTag}>SSE 流式接收</Tag> */}
                </div>
              </div>
            </div>
            <div className={styles.chat}>
              {/* 用户输入 */}
              {chatUserMsg ? (
                <ChatBubble role="user" content={chatUserMsg} />
              ) : null}
              {/* 回复 */}
              {scene.chatAgent ? (
                <ChatBubble
                  role="agent"
                  title={
                    scene.status?.text ? `Agent · ${scene.status?.text}` : ''
                  }
                  content={scene.chatAgent || ''}
                  isTyping={scene.panelMode === 'running'}
                />
              ) : null}
            </div>
          </Sider>

          {/* 中栏 */}
          <Content className={styles.colCenter}>
            <div className={styles.pipelineCard}>
              <div className={styles.pipelineTitle}>
                Agent 执行流程{' '}
                {/* <Tag className={styles.apiTag}>SSE 事件驱动步骤状态</Tag> */}
              </div>
              {/* 执行进度条 */}
              <PipelineStepper steps={scene.steps || []} />
            </div>
            {/* 进度卡片 */}
            <StepDetailCards cards={scene.cards || []} />
          </Content>

          {/* 右栏 */}
          <Sider width={400} theme="light" className={styles.colRight}>
            {renderRightPanel()}
          </Sider>
        </Layout>

        {/* 底部状态栏 */}
        <Footer className={styles.statusbar}>
          {scene.status?.text ? (
            <span
              className={`${styles.statusPill} ${styles[scene.status?.cls]}`}
            >
              <span className={styles.statusDot} />
              <span>{scene.status.text}</span>
            </span>
          ) : null}
          {/* <Text type="secondary" className={styles.hint} style={{ fontSize: 12 }}>
          刷新页面后审批状态自动恢复
        </Text>
        <div className={styles.spacer} />
        <Button size="small" danger onClick={handleReset}>
          重置演示数据
        </Button> */}
          {/* <Tag className={styles.apiTag}>POST /demo/reset</Tag> */}
        </Footer>
      </Layout>
    </Spin>
  );
};

export default AgentControl;
