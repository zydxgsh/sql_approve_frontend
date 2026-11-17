import { Button } from 'antd';
import React from 'react';
import { SceneConfig } from '../../config/scenes';
import styles from './index.less';

interface Props {
  scene: SceneConfig;
  /** 让 Agent 重新生成 */
  onRegenerate: (retryType: string) => void;
}

/** 执行失败面板 */
const FailedPanel: React.FC<Props> = (props) => {
  const { scene, onRegenerate } = props;
  const { audit, error, sql } = scene;
  return (
    <div className={styles.wrap}>
      <div className={styles.fail}>✕ SQL 执行失败</div>

      {audit && (
        <div className={styles.auditBar}>
          <span>
            <span className={styles.aK}>审批人</span>
            <span className={styles.aV}>{audit.approver}</span>
          </span>
          <span>
            <span className={styles.aK}>批准时间</span>
            <span className={styles.aV}>{audit.time}</span>
          </span>
          <span>
            <span className={styles.aK}>thread_id</span>
            <span className={styles.aV}>{audit.thread}</span>
          </span>
        </div>
      )}

      {error && (
        <div className={styles.errorBox}>
          <div className={styles.eTitle}>{error.title}</div>
          <div>{error.message}</div>
          <pre>{`${error.message}\nSQLSTATE: 42701\n事务状态: ROLLBACK 完成`}</pre>
        </div>
      )}

      {sql && (
        <div>
          <div className={styles.ioLabel}>失败的 SQL</div>
          <div
            className={styles.sqlMini}
            dangerouslySetInnerHTML={{ __html: sql }}
          />
        </div>
      )}

      {error?.note && <div className={styles.note}>{error.note}</div>}

      <div className={styles.actionRow}>
        <Button style={{ flex: 1 }} onClick={() => onRegenerate('1')}>
          返回修改
        </Button>
        <Button
          type="primary"
          style={{ flex: 1 }}
          onClick={() => onRegenerate('2')}
        >
          让 Agent 重新生成
        </Button>
      </div>
    </div>
  );
};

export default FailedPanel;
