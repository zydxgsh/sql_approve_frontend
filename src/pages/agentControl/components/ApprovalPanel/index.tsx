import { Button, Checkbox, Input, message, Select } from 'antd';
import React, { useEffect, useState } from 'react';
import { SceneConfig } from '../../config/scenes';
import styles from './index.less';

interface Props {
  scene: SceneConfig;
  threadId: string | null;
  /** 批准回调（由父组件 dispatch） */
  onApprove: (threadId: string) => void;
  /** 驳回回调 */
  onReject: (threadId: string, reason: string, type: string) => void;
}

/**
 * 审批面板
 * - 展示变更摘要、风险评估、SQL
 * - 支持批准 / 驳回（驳回需填写原因）
 * - 高危场景需勾选确认词才可批准
 */
const ApprovalPanel: React.FC<Props> = (props) => {
  const { scene, threadId, onApprove, onReject } = props;
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');
  const [dangerChecked, setDangerChecked] = useState(false);
  const [rejectType, setRejectType] = useState('sql');

  const id = threadId || localStorage.getItem('thread_id');

  // 场景切换时重置本地交互状态
  useEffect(() => {
    setShowReject(false);
    setReason('');
    setDangerChecked(false);
  }, [scene]);

  const handleApprove = () => {
    if (!id) {
      message.warning('缺少 thread_id');
      return;
    }
    onApprove(id); // 直接执行
  };

  const handleConfirmReject = () => {
    if (!reason.trim()) {
      message.warning('请填写驳回原因');
      return;
    }
    if (!id) {
      message.warning('缺少 thread_id');
      return;
    }
    if (!rejectType) {
      message.warning('请选择修改类型');
      return;
    }
    onReject(id, reason.trim(), rejectType); // 驳回
  };

  // 可逆性文案样式
  const reversibleCls = (v: string) =>
    v.includes('不可逆')
      ? styles.revNo
      : v.includes('可回滚')
      ? styles.revYes
      : '';

  console.log('-------------------------', scene.summary);

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>
        待审批 SQL 变更
        {scene.risk && (
          <span className={`${styles.riskBadge} ${styles[scene.risk.cls]}`}>
            {scene.risk.text}
          </span>
        )}
      </div>

      {scene.summary && (
        <div className={styles.summary}>
          {scene.summary.map(([k, v], i) => (
            <div key={i} className={styles.row}>
              <span className={styles.k}>{k}</span>
              <span className={`${styles.v} ${reversibleCls(v)}`}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {scene.riskNote && (
        <div>
          <div className={styles.hint} style={{ marginBottom: 6 }}>
            {scene.riskNote}
          </div>
          <div className={styles.sqlBox}>
            <div className={styles.sqlHead}>
              <span>PostgreSQL · demo_business</span>
              <span className={styles.apiTag}>generated_sql</span>
            </div>
            <pre dangerouslySetInnerHTML={{ __html: scene.sql || '' }} />
          </div>
        </div>
      )}

      {/* 高危二次确认 */}
      {scene.danger && (
        <div className={styles.dangerConfirm}>
          <Checkbox
            checked={dangerChecked}
            onChange={(e) => setDangerChecked(e.target.checked)}
          >
            <span style={{ fontSize: 13 }}>
              我确认此操作
              <span style={{ color: '#dc2626', fontWeight: 600 }}>不可逆</span>
              ，20 行 users 的 status 将被覆盖，原值无法恢复。
            </span>
          </Checkbox>
        </div>
      )}

      <div className={styles.actionRow}>
        <Button
          danger
          className={styles.rejectBtn}
          onClick={() => setShowReject((v) => !v)}
        >
          驳回并填写原因
        </Button>
        <Button
          type="primary"
          className={styles.approveBtn}
          disabled={scene.danger && !dangerChecked}
          onClick={handleApprove}
        >
          批准执行
        </Button>
      </div>
      {/* <div className={styles.hint}>
        批准/驳回均走 <span className={styles.apiTag}>POST /agent/resume</span>
        ；驳回需带 reason， Agent 结合原因回到 generate_sql。
      </div> */}
      {showReject && (
        <div>
          <Select defaultValue={rejectType} onChange={(e) => setRejectType(e)}>
            <Select.Option value="sql" key="sql">
              修改sql语句
            </Select.Option>
            <Select.Option value="requirement" key="requirement">
              修改需求
            </Select.Option>
          </Select>
          <Input.TextArea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              rejectType === 'requirement'
                ? '请填写新需求，将清空该会话之前的全部记忆，但操作历史仍保留'
                : '填写驳回原因，会喂回 Agent 重新生成，例如：不要用 NOW()，请写固定时间'
            }
          />
          <div className={styles.actionRow} style={{ marginTop: 8 }}>
            <Button onClick={() => setShowReject(false)}>取消</Button>
            <Button
              danger
              type="primary"
              style={{ flex: 1 }}
              onClick={handleConfirmReject}
            >
              确认驳回
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalPanel;
