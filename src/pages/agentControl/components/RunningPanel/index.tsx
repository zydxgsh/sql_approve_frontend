import React from 'react';
import styles from './index.less';

/** Agent 执行中占位面板 */
const RunningPanel: React.FC = () => {
  return (
    <div className={styles.wrap}>
      <div className={styles.spinner} />
      <div className={styles.title}>Agent 执行中</div>
      <div className={styles.sub}>
        正在解析需求并生成 SQL，审批面板将在 Agent 暂停后激活。
      </div>
      <div className={styles.hint}>SSE 流式推送 · 当前节点：生成 SQL</div>
    </div>
  );
};

export default RunningPanel;
