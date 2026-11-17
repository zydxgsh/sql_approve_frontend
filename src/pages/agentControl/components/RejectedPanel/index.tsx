import { Button, Input, message, Select } from 'antd';
import React, { useState } from 'react';
import { SceneConfig } from '../../config/scenes';
import styles from './index.less';

interface Props {
  scene: SceneConfig;
  threadId: string | null;
  onApprove: (threadId: string) => void;
  onReject: (threadId: string, reason: string, type: string) => void;
}

/**
 * 已驳回 · 重新生成待审面板
 * 展示驳回原因、旧 SQL（折叠）、重写后 SQL，并支持再次批准/驳回
 */
const RejectedPanel: React.FC<Props> = (props) => {
  const { scene, threadId, onApprove, onReject } = props;
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');
  const [rejectType, setRejectType] = useState('sql');

  const handleApprove = () => {
    if (!threadId) return message.warning('缺少 thread_id');
    onApprove(threadId);
  };

  const handleConfirmReject = () => {
    if (!reason.trim()) return message.warning('请填写再次驳回的原因');
    if (!threadId) return message.warning('缺少 thread_id');
    if (!rejectType) {
      message.warning('请选择修改类型');
      return;
    }
    onReject(threadId, reason.trim(), rejectType);
  };

  const reversibleCls = (v: string) =>
    v.includes('不可逆')
      ? styles.revNo
      : v.includes('可回滚')
      ? styles.revYes
      : '';

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>
        已驳回 · 待再次审批
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

      {scene.rejectReason && (
        <div className={styles.rejectBanner}>
          <div className={styles.rejectTitle}>
            驳回原因（已写入 State 并喂回 Agent）
          </div>
          <div style={{ fontSize: 13 }}>{scene.rejectReason}</div>
        </div>
      )}

      {scene.oldSql && (
        <details open style={{ fontSize: 13 }}>
          <summary className={styles.summaryBox}>
            查看被驳回的旧 SQL（NOW() 版本）
          </summary>
          <div className={styles.sqlBox} style={{ marginTop: 8 }}>
            <pre
              style={{ opacity: 0.7 }}
              dangerouslySetInnerHTML={{ __html: scene.oldSql }}
            />
          </div>
        </details>
      )}

      <div className={styles.sqlBox}>
        <div className={styles.sqlHead}>
          <span>Agent 重写后 SQL · PostgreSQL</span>
          <span className={styles.apiTag}>generated_sql v2</span>
        </div>
        <pre dangerouslySetInnerHTML={{ __html: scene.sql || '' }} />
      </div>

      <div className={styles.actionRow}>
        <Button
          danger
          className={styles.rejectBtn}
          onClick={() => setShowReject((v) => !v)}
        >
          再次驳回
        </Button>
        <Button
          type="primary"
          className={styles.approveBtn}
          onClick={handleApprove}
        >
          批准执行
        </Button>
      </div>

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

export default RejectedPanel;
